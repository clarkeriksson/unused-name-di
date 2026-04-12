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
    Provider extends new (...args: any[]) => infer ClassInstance
        ? ClassInstance
        : Provider extends (...args: any[]) => infer FactoryInstance
          ? FactoryInstance
          : never;

/**
 * Tuple of argument types used in a {@link ServiceProvider}.
 */
export type ServiceArgs<Provider extends ServiceProvider> =
    Provider extends new (...args: infer ClassArgs) => any
        ? ClassArgs
        : Provider extends (...args: infer FactoryArgs) => any
          ? FactoryArgs
          : never;

/**
 * Allowed service scopes.
 */
const SERVICE_SCOPES = ["singleton", "scoped", "transient"] as const;

/**
 * Union type of allowed service scope strings.
 */
export type ServiceScope = (typeof SERVICE_SCOPES)[number];

/**
 * Object type containing the service scope and factory for some service key.
 */
export interface ServiceInfo<Scope extends ServiceScope = ServiceScope, T = any> {
    readonly scope: Scope;
    get factory(): ServiceFactory<T>;
}

export const RAW_PROVIDER = Symbol("rawProvider");

export class ServiceInfoImpl<
    Scope extends ServiceScope = ServiceScope,
    Service = any,
> implements ServiceInfo<Scope, Service> {
    readonly scope: Scope;
    readonly lazy: () => ServiceProvider<Service>;
    private _factory: ServiceFactory<Service> | null = null;
    get factory(): ServiceFactory<Service> {
        return (this._factory ??= ServiceInfoImpl.normalize(this.lazy()));
    }

    get [RAW_PROVIDER](): ServiceProvider<Service> {
        return this.lazy();
    }

    constructor(scope: Scope, lazy: () => ServiceProvider<Service>) {
        this.scope = scope;
        this.lazy = lazy;
    }

    /**
     * Creates a copy of this service prepared to be part of a new container.
     */
    _derive(): ServiceInfoImpl<Scope, Service> {
        if (this.scope === "singleton") {
            return this;
        }
        return new ServiceInfoImpl(this.scope, this.lazy);
    }

    private static isClass(fn: unknown): fn is new (...args: any[]) => any {
        return typeof fn === "function" && !!fn.prototype?.constructor;
    }

    private static normalize<Service>(
        provider: ServiceProvider<Service>,
    ): ServiceFactory<Service> {
        if (ServiceInfoImpl.isClass(provider)) {
            return (...args: any[]) => new provider(...args);
        } else {
            return provider;
        }
    }
}
