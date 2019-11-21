import ILayer from './ILayer';
export default interface IQueueItem<T> {
    item: T;
    layer: ILayer<T>;
    dependList: T[];
    isFrozen: boolean;
    removeHandlers: Array<() => void>;
}
