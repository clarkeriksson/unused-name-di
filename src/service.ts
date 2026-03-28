/**
 * Factory function returning a service.
 */
type ServiceFactory<Service = any, Args extends any[] = any[]> = (...args: Args) => Service;

/**
 * Class constructor returning a service.
 */
type ServiceConstructor<Service = any, Args extends any[] = any[]> = new (...args: Args) => Service;

/**
 * Factory or constructor returning a service.
 */
type ServiceProvider<Service = any, Args extends any[] = any[]> = 
    | ServiceFactory<Service, Args>
    | ServiceConstructor<Service, Args>;

/**
 * Object type returned from a {@link ServiceProvider}.
 */
type ServiceInstance<Provider extends ServiceProvider> =
    Provider extends (new (...args: any[]) => infer ClassInstance)
        ? ClassInstance
        : Provider extends ((...args: any[]) => infer FactoryInstance)
            ? FactoryInstance
            : never;

/**
 * Tuple of argument types used in a {@link ServiceProvider}.
 */
type ServiceArgs<Provider extends ServiceProvider> =
    Provider extends (new (...args: infer ClassArgs) => any)
        ? ClassArgs
        : Provider extends ((...args: infer FactoryArgs) => any)
            ? FactoryArgs
            : never;

/**
 * Record type of service keys mapping to service types.
 */
type ServiceLookup = Record<PropertyKey, any>;

/**
 * Metadata type for singleton services.
 */
type SingletonServiceInfo<T = any> = {
    readonly type: "singleton",
    readonly service: ServiceFactory<T>
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
type TransientServiceInfo<T = any> = {
    readonly type: "transient",
    readonly service: ServiceFactory<T>
} & ({
    simple: false,
    deps: (() => any)[]
} | {
    simple: true,
    deps?: (() => any)[]
});

/**
 * Metadata type for services.
 */
type ServiceInfo<T = any> =
    | SingletonServiceInfo<T>
    | TransientServiceInfo<T>;

/**
 * Record type of service keys mapping to service info types.
 */
type ServiceInfoLookup = Record<PropertyKey, ServiceInfo>;

/**
 * Tuple type of possible keys for the given service types.
 */
type ServiceKeysForServices<Lookup extends ServiceLookup, Services extends any[]> = {
    [Index in keyof Services]: {
        [ServiceKey in keyof Lookup]: Lookup[ServiceKey] extends Services[Index] ? ServiceKey : never;
    }[keyof Lookup];
};

/**
 * Union type of keys not included in the service info lookup that were specified in the service lookup.
 */
type MissingServiceKeys<Lookup extends ServiceLookup, Info extends ServiceInfoLookup> = {
    [ServiceKey in keyof Lookup]: ServiceKey extends keyof Info
        ? ServiceInstance<Info[ServiceKey]["service"]> extends Lookup[ServiceKey]
            ? never
            : ServiceKey
        : ServiceKey;
}[keyof Lookup];