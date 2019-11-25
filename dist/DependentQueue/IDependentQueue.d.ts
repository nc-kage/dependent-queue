export default interface IDependentQueue<T> {
    peek(type?: string): T | null;
    poll(type?: string): T | null;
    offer(item: T, depend?: T | T[]): boolean | boolean[];
    moveEnd(item: T): void;
    checkQueueEmpty(type?: string): boolean;
}
