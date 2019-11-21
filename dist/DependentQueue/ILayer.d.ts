import IQueueItem from './IQueueItem';
export default interface ILayer<T> {
    items: T[];
    queues: {
        [type: string]: Array<IQueueItem<T>>;
    };
    frozenQueues: {
        [type: string]: Array<IQueueItem<T>>;
    };
}
