export declare type DependentQueueEventMapType = {
    onExist(): void;
    onEmpty(): void;
    onChange(): void;
    onExistType(type: string): void;
    onEmptyType(type: string): void;
    onChangeType(type: string): void;
};
