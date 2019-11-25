export declare type DependentQueueEventMapType = {
    exist(): void;
    empty(): void;
    change(): void;
    existType(type: string): void;
    emptyType(type: string): void;
    changeType(type: string): void;
};
