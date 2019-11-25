import IDependentQueue from './IDependentQueue';
import IQueueItem from './IQueueItem';
declare class DependentQueue<T> implements IDependentQueue<T> {
    private readonly typeGetter;
    private layers;
    private typeOrder;
    constructor(typeGetter?: (item: T) => string);
    peek(type?: string): T | null;
    poll(type?: string): T | null;
    offer(item: T, depend?: T | T[]): boolean | boolean[];
    moveEnd(item: T): void;
    checkQueueEmpty(type?: string): boolean;
    protected freezeItem(queueItem: IQueueItem<T>): void;
    private addTypeToOrderList;
    private getFirstLayerQueue;
    private offerToLayer;
    private getLayer;
    private getItemLayerIndex;
    private addPollListener;
    private getItemQueueItem;
    private getItemLayer;
    private removeItemHandler;
    private moveQueueItemToLayer;
    private removeFromLayer;
}
export default DependentQueue;
