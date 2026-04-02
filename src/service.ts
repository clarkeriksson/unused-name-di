/**
 * Factory function returning a service.
 */
export type ServiceFactory<Service = any> = (...args: any[]) => Service;

/**
 * Class constructor returning a service.
 */
export type ServiceConstructor<Service = any> = new (...args: any[]) => Service;

/**
 * Factory or constructor returning a service.
 */
export type ServiceProvider<Service = any> = 
    | ServiceFactory<Service>
    | ServiceConstructor<Service>;

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
 * Allowed service types.
 */
const SERVICE_TYPES = ["singleton", "scoped", "transient"] as const;

/**
 * Union type of allowed service type strings.
 */
export type ServiceType = (typeof SERVICE_TYPES)[number];

/**
 * Object type containing the service type and factory for some service key.
 */
export interface ServiceInfo<Kind extends ServiceType = ServiceType, T = any> {
    readonly kind: Kind;
    get factory(): ServiceFactory<T>;
}

export class ServiceInfoImpl<Kind extends ServiceType = ServiceType, Service = any> implements ServiceInfo<Kind, Service> {
    readonly kind: Kind;
    readonly lazy: () => ServiceProvider<Service>;
    private _factory: ServiceFactory<Service> | null = null;
    get factory(): ServiceFactory<Service> {
        return (this._factory ??= ServiceInfoImpl.normalize(this.lazy()));
    }

    get rawProvider(): ServiceProvider<Service> {
        return (this.lazy());
    }

    constructor(kind: Kind, lazy: () => ServiceProvider<Service>) {
        this.kind = kind;
        this.lazy = lazy;
    }

    /**
     * Creates a copy of this service prepared to be part of a new container.
     */
    _derive(): ServiceInfoImpl<Kind, Service> {
        if (this.kind === "singleton") {
            return this;
        }
        return new ServiceInfoImpl(this.kind, this.lazy);
    }

    private static isClass(fn: unknown): fn is new (...args: any[]) => any {
        return typeof fn === "function" && !!fn.prototype?.constructor;
    }

    private static normalize<Service>(provider: ServiceProvider<Service>): ServiceFactory<Service> {
        if (ServiceInfoImpl.isClass(provider)) {
            return (...args: any[]) => new provider(...args);
        } else {
            return provider;
        }
    }
}