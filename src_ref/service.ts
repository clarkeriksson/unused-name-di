/**
 * Factory function returning a service.
 */
export type ServiceFactory<Service = any, Args extends any[] = any[]> = (
    ...args: Args
) => Service;

/**
 * Class constructor returning a service.
 */
export type ServiceConstructor<
    Service = any,
    Args extends any[] = any[],
> = new (...args: Args) => Service;

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
export interface ServiceInfo<
    Scope extends ServiceScope = ServiceScope,
    T = any,
> {
    readonly scope: Scope;
    readonly provider: ServiceProvider<T>;
    readonly kind: "class" | "factory";
    //get factory(): ServiceFactory<T>;
}

export const RAW_PROVIDER = Symbol("rawProvider");

export class ServiceInfoImpl<
    Scope extends ServiceScope = ServiceScope,
    Service = any,
> implements ServiceInfo<Scope, Service> {
    readonly scope: Scope;
    readonly lazy: () => ServiceProvider<Service>;
    private _provider: ServiceProvider<Service> | null = null;
    get provider() {
        return (this._provider ??= this.lazy());
    }
    readonly kind: "class" | "factory";

    constructor(
        scope: Scope,
        lazy: () => ServiceProvider<Service>,
        kind: "class" | "factory",
    ) {
        this.scope = scope;
        this.lazy = lazy;
        this.kind = kind;
    }

    /**
     * Creates a copy of this service prepared to be part of a new container.
     */
    _derive(): ServiceInfoImpl<Scope, Service> {
        if (this.scope === "singleton") {
            return this;
        }
        return new ServiceInfoImpl(this.scope, this.lazy, this.kind);
    }
}
