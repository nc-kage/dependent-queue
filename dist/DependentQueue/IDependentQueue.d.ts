export default interface IDependentQueue<T> {
    peek(): T | null;
    poll(): T | null;
    offer(item: T, depend?: T | T[]): boolean | boolean[];
    moveEnd(item: T): void;
}
