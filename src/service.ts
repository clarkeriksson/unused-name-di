/**
 * Factory function returning a service.
 */
export type ServiceFactory<Service = any, Args extends any[] = any[]> = (...args: Args) => Service;

/**
 * Class constructor returning a service.
 */
export type ServiceConstructor<Service = any, Args extends any[] = any[]> = new (...args: Args) => Service;

/**
 * Factory or constructor returning a service.
 */
export type ServiceProvider<Service = any, Args extends any[] = any[]> = 
    | ServiceFactory<Service, Args>
    | ServiceConstructor<Service, Args>;

/**
 * Object type returned from a {@link ServiceProvider}.
 */
export type ServiceInstance<Provider extends ServiceProvider> =
    Provider extends (new (...args: any[]) => infer ClassInstance)
        ? ClassInstance
        : Provider extends ((...args: any[]) => infer FactoryInstance)
            ? FactoryInstance
            : never;

/**
 * Tuple of argument types used in a {@link ServiceProvider}.
 */
export type ServiceArgs<Provider extends ServiceProvider> =
    Provider extends (new (...args: infer ClassArgs) => any)
        ? ClassArgs
        : Provider extends ((...args: infer FactoryArgs) => any)
            ? FactoryArgs
            : never;

/**
 * Metadata type for singleton services.
 */
export type SingletonServiceInfo<T = any, Args extends any[] = any[]> = {
    readonly type: "singleton",
    readonly service: ServiceFactory<T, Args>
} & ({
    simple: false,
    deps: (() => any)[]
} | {
    simple: true,
    deps?: (() => any)[]
});

/**
 * Metadata type for transient services.
 */
export type TransientServiceInfo<T = any, Args extends any[] = any[]> = {
    readonly type: "transient",
    readonly service: ServiceFactory<T, Args>
} & ({
    simple: false,
    deps: (() => any)[]
} | {
    simple: true,
    deps?: (() => any)[]
});

/**
 * Metadata type for primitive value services.
 */
export type PrimitiveServiceInfo<T extends string | number | boolean | symbol | bigint | null | undefined = any> = {
    readonly type: "primitive",
    readonly service: ServiceFactory<T, []>,
    simple: true
};

/**
 * Metadata type for services.
 */
export type ServiceInfo<T = any, Args extends any[] = any[]> =
    | SingletonServiceInfo<T, Args>
    | TransientServiceInfo<T, Args>
    | (T extends string | number | boolean | symbol | bigint | null | undefined
            ? PrimitiveServiceInfo<T>
            : never);