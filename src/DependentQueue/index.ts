import isArray from 'lodash/isArray';
import isNull from 'lodash/isNull';
import isNumber from 'lodash/isNumber';
import last from 'lodash/last';

import IDependentQueue from './IDependentQueue';
import ILayer from './ILayer';
import IQueueItem from './IQueueItem';

class DependentQueue<T> implements IDependentQueue<T> {
  private readonly typeGetter: (item: T) => string;
  private layers: Array<ILayer<T>> = [];
  private typeOrder: string[] = [];

  constructor(typeGetter?: (item: T) => string) {
    this.typeGetter = typeGetter || ((item: T): string => '1');
  }

  public peek(type?: string): T | null {
    const queue = this.getFirstLayerQueue(type);
    if (!queue) return null;
    return queue[0]?.item || null;
  }

  public poll(type?: string): T | null {
    const queue = this.getFirstLayerQueue(type);
    if (!queue || !queue[0]) return null;
    const queueItem = queue.shift() as IQueueItem<T>;
    const { item, layer: { items } } = queueItem;
    queueItem.removeHandlers.forEach(handler => handler());
    const index = items.indexOf(item);
    if (index >= 0) items.splice(index, 1);
    return item;
  }

  public offer(item: T, depend?: T | T[]): boolean | boolean[] {
    this.addTypeToOrderList(item);
    if (!depend) return !isNull(this.offerToLayer(item, 0));
    const isDependArray = isArray(depend);
    const dependList = (isDependArray ? depend : [depend]) as T[];
    const layerIndexList = dependList.map(dependItem => this.getItemLayerIndex(dependItem));
    if (layerIndexList.some(isNull)) {
      return isDependArray
        ? layerIndexList.map((index: number | null): boolean => !isNull(index)) : false;
    }
    const dependLayerIndex = Math.max(...layerIndexList as number[]);
    const sortedDependList = dependList
      .map((
        dependListItem, index,
      ) => ({ item: dependListItem, index: layerIndexList[index] as number }))
      .sort((first, second): number => first.index - second.index)
      .map((dependListItemInfo): T => dependListItemInfo.item);
    const queueItem = this.offerToLayer(item, dependLayerIndex + 1, sortedDependList);
    if (!queueItem) return false;
    sortedDependList.forEach((dependListItem: T) => {
      this.addPollListener(queueItem, dependListItem);
    });
    return true;
  }

  public moveEnd(item: T): void {
    const layer = this.getItemLayer(item);
    if (!layer) return;
    const type = this.typeGetter(item);
    const queue = layer.queues[type];
    if (!queue) return;
    const index = queue.findIndex((checkQueueItem): boolean => checkQueueItem.item === item);
    if (index < 0) return;
    const queueItem = queue.splice(index, 1);
    queue.push(queueItem[0]);
  }

  protected freezeItem(queueItem: IQueueItem<T>) {
    const { item } = queueItem;
    const layer = this.getItemLayer(item);
    if (!layer) return;
    const type = this.typeGetter(item);
    if (!type) return;
    const queue = layer.queues[type];
    if (!queue) return;
    const queueItemIndex = queue.indexOf(queueItem);
    if (queueItemIndex >= 0) queue.splice(queueItemIndex, 1);
    if (!layer.frozenQueues[type]) layer.frozenQueues[type] = [];
    queueItem.isFrozen = true;
    layer.frozenQueues[type].push(queueItem);
  }

  private addTypeToOrderList(item: T) {
    const { typeOrder } = this;
    const type = this.typeGetter(item);
    if (!typeOrder.includes(type)) typeOrder.push(type);
  }

  private getFirstLayerQueue(type?: string): Array<IQueueItem<T>> | null {
    const { typeOrder } = this;
    const firstLayer = this.layers[0];
    if (!firstLayer) return null;
    const { queues } = firstLayer;
    if (type) return queues[type] || null;
    const generalType =  typeOrder
      .filter((checkType): boolean => Boolean(queues[checkType]))
      .find((checkType): boolean => queues[checkType].length > 0);
    return generalType ? queues[generalType] : null;
  }

  private offerToLayer(item: T, layerIndex: number, dependList?: T[]): IQueueItem<T> | null {
    const type = this.typeGetter(item);
    const layer = this.getLayer(layerIndex);
    if (!type) return null;
    if (!layer.queues[type]) layer.queues[type] = [];
    const queueItem = {
      item, layer, isFrozen: false, removeHandlers: [], dependList: dependList || [],
    };
    layer.queues[type].push(queueItem);
    layer.items.push(item);
    return queueItem;
  }

  private getLayer(index: number): ILayer<T> {
    const { layers } = this;
    if (layers[index]) return layers[index];
    for (let i = 0; i <= index; i += 1) {
      if (!layers[i]) layers.push({ queues: {}, frozenQueues: {}, items: [] });
    }
    return layers[index];
  }

  private getItemLayerIndex(item: T): number | null {
    const index = this.layers.findIndex((layer): boolean => layer.items.includes(item));
    return index >= 0 ? index : null;
  }

  private addPollListener(queueItem: IQueueItem<T>, depend: T) {
    const dependQueueItem = this.getItemQueueItem(depend);
    if (dependQueueItem) {
      dependQueueItem.removeHandlers.push(() => {
        this.removeItemHandler(queueItem, dependQueueItem);
      });
    }
  }

  private getItemQueueItem(item: T): IQueueItem<T> | null {
    const layer = this.getItemLayer(item);
    const type = this.typeGetter(item);
    return layer
      ? (layer.queues[type] || []).find((queueItem): boolean => queueItem.item === item)
        || (layer.frozenQueues[type] || []).find((queueItem): boolean => queueItem.item === item)
        || null
      : null;
  }

  private getItemLayer(item: T): ILayer<T> | null {
    const index = this.getItemLayerIndex(item);
    if (isNull(index)) return index;
    return this.getLayer(index);
  }

  private removeItemHandler(queueItem: IQueueItem<T>, dependQueueItem: IQueueItem<T>) {
    const { dependList } = queueItem;
    const dependItemIndex = dependList.indexOf(dependQueueItem.item);
    if (dependItemIndex < 0) return;
    const isLast = dependItemIndex === dependList.length - 1;
    dependList.splice(dependItemIndex, 1);
    if (!isLast) return;
    if (!dependList.length) return this.moveQueueItemToLayer(queueItem, 0);
    const nextDependItem = last(dependList) as T;
    const nextDependItemLayerIndex = this.getItemLayerIndex(nextDependItem);
    if (isNull(nextDependItemLayerIndex)) return this.freezeItem(queueItem);
    this.moveQueueItemToLayer(queueItem, nextDependItemLayerIndex + 1);
    this.addPollListener(queueItem, nextDependItem);
  }

  private moveQueueItemToLayer(queueItem: IQueueItem<T>, layer: ILayer<T> | number) {
    const { layer: currentLayer, item } = queueItem;
    const targetLayer = isNumber(layer) ? this.getLayer(layer) : layer;
    if (!targetLayer) return;
    const type = this.typeGetter(item);
    if (!type) return;
    if (!targetLayer.queues[type]) targetLayer.queues[type] = [];
    const layerItemIndex = currentLayer.items.indexOf(item);
    if (layerItemIndex >= 0) currentLayer.items.splice(layerItemIndex, 1);
    targetLayer.queues[type].push(queueItem);
    targetLayer.items.push(item);
    queueItem.layer = targetLayer;
  }
}

export default DependentQueue;
