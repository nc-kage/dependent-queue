"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isArray_1 = __importDefault(require("lodash/isArray"));
const isNull_1 = __importDefault(require("lodash/isNull"));
const isNumber_1 = __importDefault(require("lodash/isNumber"));
const last_1 = __importDefault(require("lodash/last"));
class DependentQueue {
    constructor(typeGetter) {
        this.layers = [];
        this.typeOrder = [];
        this.typeGetter = typeGetter || ((item) => '1');
    }
    peek(type) {
        var _a;
        const queue = this.getFirstLayerQueue(type);
        if (!queue)
            return null;
        return ((_a = queue[0]) === null || _a === void 0 ? void 0 : _a.item) || null;
    }
    poll(type) {
        const queue = this.getFirstLayerQueue(type);
        if (!queue || !queue[0])
            return null;
        const queueItem = queue.shift();
        const { item, layer: { items } } = queueItem;
        queueItem.removeHandlers.forEach(handler => handler());
        const index = items.indexOf(item);
        if (index >= 0)
            items.splice(index, 1);
        return item;
    }
    offer(item, depend) {
        this.addTypeToOrderList(item);
        if (!depend)
            return !isNull_1.default(this.offerToLayer(item, 0));
        const isDependArray = isArray_1.default(depend);
        const dependList = (isDependArray ? depend : [depend]);
        const layerIndexList = dependList.map(dependItem => this.getItemLayerIndex(dependItem));
        if (layerIndexList.some(isNull_1.default)) {
            return isDependArray
                ? layerIndexList.map((index) => !isNull_1.default(index)) : false;
        }
        const dependLayerIndex = Math.max(...layerIndexList);
        const sortedDependList = dependList
            .map((dependListItem, index) => ({ item: dependListItem, index: layerIndexList[index] }))
            .sort((first, second) => first.index - second.index)
            .map((dependListItemInfo) => dependListItemInfo.item);
        const queueItem = this.offerToLayer(item, dependLayerIndex + 1, sortedDependList);
        if (!queueItem)
            return false;
        sortedDependList.forEach((dependListItem) => {
            this.addPollListener(queueItem, dependListItem);
        });
        return true;
    }
    moveEnd(item) {
        const layer = this.getItemLayer(item);
        if (!layer)
            return;
        const type = this.typeGetter(item);
        const queue = layer.queues[type];
        if (!queue)
            return;
        const index = queue.findIndex((checkQueueItem) => checkQueueItem.item === item);
        if (index < 0)
            return;
        const queueItem = queue.splice(index, 1);
        queue.push(queueItem[0]);
    }
    checkQueueEmpty(type) {
        return !this.layers.some((layer) => {
            const { queues } = layer;
            return type
                ? (queues[type] || []).length > 0
                : Object.keys(queues).some((key) => (queues[key] || []).length > 0);
        });
    }
    freezeItem(queueItem) {
        const { item } = queueItem;
        const layer = this.getItemLayer(item);
        if (!layer)
            return;
        const type = this.typeGetter(item);
        if (!type)
            return;
        const queue = layer.queues[type];
        if (!queue)
            return;
        const queueItemIndex = queue.indexOf(queueItem);
        if (queueItemIndex >= 0)
            queue.splice(queueItemIndex, 1);
        if (!layer.frozenQueues[type])
            layer.frozenQueues[type] = [];
        queueItem.isFrozen = true;
        layer.frozenQueues[type].push(queueItem);
    }
    addTypeToOrderList(item) {
        const { typeOrder } = this;
        const type = this.typeGetter(item);
        if (!typeOrder.includes(type))
            typeOrder.push(type);
    }
    getFirstLayerQueue(type) {
        const { typeOrder } = this;
        const firstLayer = this.layers[0];
        if (!firstLayer)
            return null;
        const { queues } = firstLayer;
        if (type)
            return queues[type] || null;
        const generalType = typeOrder
            .filter((checkType) => Boolean(queues[checkType]))
            .find((checkType) => queues[checkType].length > 0);
        return generalType ? queues[generalType] : null;
    }
    offerToLayer(item, layerIndex, dependList) {
        const type = this.typeGetter(item);
        const layer = this.getLayer(layerIndex);
        if (!type)
            return null;
        if (!layer.queues[type])
            layer.queues[type] = [];
        const queueItem = {
            item, layer, isFrozen: false, removeHandlers: [], dependList: dependList || [],
        };
        layer.queues[type].push(queueItem);
        layer.items.push(item);
        return queueItem;
    }
    getLayer(index) {
        const { layers } = this;
        if (layers[index])
            return layers[index];
        for (let i = 0; i <= index; i += 1) {
            if (!layers[i])
                layers.push({ queues: {}, frozenQueues: {}, items: [] });
        }
        return layers[index];
    }
    getItemLayerIndex(item) {
        const index = this.layers.findIndex((layer) => layer.items.includes(item));
        return index >= 0 ? index : null;
    }
    addPollListener(queueItem, depend) {
        const dependQueueItem = this.getItemQueueItem(depend);
        if (dependQueueItem) {
            dependQueueItem.removeHandlers.push(() => {
                this.removeItemHandler(queueItem, dependQueueItem);
            });
        }
    }
    getItemQueueItem(item) {
        const layer = this.getItemLayer(item);
        const type = this.typeGetter(item);
        return layer
            ? (layer.queues[type] || []).find((queueItem) => queueItem.item === item)
                || (layer.frozenQueues[type] || []).find((queueItem) => queueItem.item === item)
                || null
            : null;
    }
    getItemLayer(item) {
        const index = this.getItemLayerIndex(item);
        if (isNull_1.default(index))
            return index;
        return this.getLayer(index);
    }
    removeItemHandler(queueItem, dependQueueItem) {
        const { dependList } = queueItem;
        const dependItemIndex = dependList.indexOf(dependQueueItem.item);
        if (dependItemIndex < 0)
            return;
        const isLast = dependItemIndex === dependList.length - 1;
        dependList.splice(dependItemIndex, 1);
        if (!isLast)
            return;
        if (!dependList.length)
            return this.moveQueueItemToLayer(queueItem, 0);
        const nextDependItem = last_1.default(dependList);
        const nextDependItemLayerIndex = this.getItemLayerIndex(nextDependItem);
        if (isNull_1.default(nextDependItemLayerIndex))
            return this.freezeItem(queueItem);
        this.moveQueueItemToLayer(queueItem, nextDependItemLayerIndex + 1);
        this.addPollListener(queueItem, nextDependItem);
    }
    moveQueueItemToLayer(queueItem, layer) {
        const { layer: currentLayer, item } = queueItem;
        const targetLayer = isNumber_1.default(layer) ? this.getLayer(layer) : layer;
        if (!targetLayer)
            return;
        const type = this.typeGetter(item);
        if (!type)
            return;
        if (!targetLayer.queues[type])
            targetLayer.queues[type] = [];
        this.removeFromLayer(currentLayer, item);
        targetLayer.queues[type].push(queueItem);
        targetLayer.items.push(item);
        queueItem.layer = targetLayer;
    }
    removeFromLayer(layer, item) {
        const type = this.typeGetter(item);
        const { items, queues } = layer;
        const itemsIndex = items.indexOf(item);
        if (itemsIndex >= 0)
            items.splice(itemsIndex, 1);
        const queueItemIndex = type && queues[type]
            ? queues[type].findIndex((queueItem) => queueItem.item === item)
            : -1;
        if (queueItemIndex >= 0)
            queues[type].splice(queueItemIndex, 1);
    }
}
exports.default = DependentQueue;
