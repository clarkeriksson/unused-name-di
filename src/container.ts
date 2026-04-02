import { ServiceInfoImpl, ServiceType, type ServiceArgs, type ServiceInfo, type ServiceInstance, type ServiceProvider } from "./service.js";

/**
 * Utility type to simplify how built dict-like types render in IDE preview.
 */
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

/**
 * Type returning the broad primitive type for primitive const type inputs, otherwise the type passes through.
 */
type Broaden<T> = 
    T extends string ?
    string :
    T extends number ?
    number :
    T extends boolean ?
    boolean :
    T extends symbol ?
    symbol :
    T extends bigint ?
    bigint :
    T extends null ?
    null :
    T extends undefined ?
    undefined :
    T;

/**
 * Tuple type of service keys corresponding to services matching the provided tuple of values.
 */
export type KeysForValues<T extends Record<PropertyKey, ServiceInfo>, Values extends readonly any[]> = {
    [Index in keyof Values]: {
        [Key in keyof T]: Values[Index] extends Broaden<ServiceInstance<T[Key]["factory"]>> ? Key : never;
    }[keyof T];
};

/**
 * Object returned from registration methods to specify a service and optionally a type for that service.
 */
type RegistrationHandler<
    Services extends Record<PropertyKey, ServiceInfo>,
    Key extends PropertyKey, 
    Kind extends ServiceType
> = {
    /**
     * Registers the service provider and associated service given by the provided getter function. Returns an updated
     * {@link InjectionContainer} to continue registration.
     */
    use<Service>(
        lazy: () => ServiceProvider<Service>
    ): InjectionContainer<Prettify<Services & { [K in Key]: ServiceInfo<Kind, Service> }>>;
}

/**
 * A dependency injection container. Multiple containers can exist.
 */
export interface InjectionContainer<
    Services extends Record<PropertyKey, ServiceInfo> = {}
> {
    /**
     * **Singleton services resolve to the same instance globally.**
     * 
     * Begins the registration of a singleton service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a getter for the associated constructor or factory is
     * provided as an arg, and an optional generic type param can be provided to specify a broader type to register
     * the service as. 
     * 
     * _WARNING: Since singleton services are the same across containers, it is important to recognize that any non-singleton 
     * dependencies of this service will be derived from the container it is registered in. Because of this it is 
     * recommended to only have singleton dependencies, but not strictly prohibited by this library._
     * 
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    singleton<Key extends PropertyKey>(key: Key): RegistrationHandler<Services, Key, "singleton">;

    /**
     * **Scoped services resolve to the same instance within a container.**
     * 
     * Begins the registration of a scoped service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a getter for the associated constructor or factory is
     * provided as an arg, and an optional generic type param can be provided to specify a broader type to register
     * the service as. 
     * 
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    scoped<Key extends PropertyKey>(key: Key): RegistrationHandler<Services, Key, "scoped">;

    /**
     * **Transient services always resolve to a new instance.**
     * 
     * Begins the registration of a transient service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a getter for the associated constructor or factory is
     * provided as an arg, and an optional generic type param can be provided to specify a broader type to register
     * the service as.
     * 
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    transient<Key extends PropertyKey>(key: Key): RegistrationHandler<Services, Key, "transient">;

    /**
     * Takes in a service constructor or factory and returns a function to specify the services to inject as parameters
     * via a list of strongly-typed service keys.
     * @param provider The target constructor or factory.
     * @returns A function taking in the keys associated with services to inject.
     */
    inject<P extends ServiceProvider>(provider: P): {
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(...keys: Keys): void 
    };

    /**
     * Provides an instance of the service associated with the given key, in compliance with the configuration.
     * @param key The service key.
     * @returns An instance of the associated service.
     */
    resolve<Key extends keyof Services>(key: Key): ServiceInstance<Services[Key]["factory"]>;
    
    /**
     * An object providing a decorator-specific injection method. Can only be used on class definitions and only
     * requires keys associated with the services to inject. This is for TS5+ decorators matching the upcoming
     * ECMAScript decorator feature, not experimental legacy decorators. This can be called outside of that context,
     * but the type inference fails in those scenarios. Prefer the {@link InjectionContainer.inject} method instead.
     */
    readonly dec: {
        inject<const Keys extends KeysForValues<Services, ServiceArgs<P>>, P extends ServiceProvider>(
            ...keys: Keys
        ): (provider: P) => void;
    }

    /**
     * Creates a new container that inherits the configuration from the calling container. Can be extended upon without
     * disrupting the parent container. Singleton instances are unique per container. To avoid unneeded complexity,
     * global singletons are not implemented, but providing a 'singleton' provider that only returns a reference to
     * one object will behave identically.
     */
    child(): InjectionContainer<Services>;

    /**
     * Releases object references.
     */
    dispose(): void;
}

export class InjectionContainerImpl<
    Services extends Record<PropertyKey, ServiceInfo> = {}
> implements InjectionContainer<Services> {
    #disposed: boolean = false;

    private serviceInfo: Record<PropertyKey, ServiceInfoImpl> = {};
    private implToDeps: Map<ServiceProvider, PropertyKey[]> = new Map();
    private resolverCache: Map<PropertyKey, () => any> = new Map();

    singleton<Key extends PropertyKey>(key: Key): RegistrationHandler<Services, Key, "singleton"> {
        this.assertNotDisposed();
        return {
            use: <S>(lazy: () => ServiceProvider<S>): InjectionContainer<Prettify<Services & { [K in Key]: ServiceInfo<"singleton", S> }>> => {
                (this.serviceInfo as Record<PropertyKey, ServiceInfo>)[key] = new ServiceInfoImpl("singleton", lazy);
                return this as any;
            }
        } 
    }

    scoped<Key extends PropertyKey>(key: Key): RegistrationHandler<Services, Key, "scoped"> {
        this.assertNotDisposed();
        return {
            use: <S>(lazy: () => ServiceProvider<S>): InjectionContainer<Prettify<Services & { [K in Key]: ServiceInfo<"scoped", S> }>> => {
                (this.serviceInfo as Record<PropertyKey, ServiceInfo>)[key] = new ServiceInfoImpl("scoped", lazy);
                return this as any;
            }
        } 
    }    

    transient<Key extends PropertyKey>(key: Key): RegistrationHandler<Services, Key, "transient"> {
        this.assertNotDisposed();
        return {
            use: <S>(lazy: () => ServiceProvider<S>): InjectionContainer<Prettify<Services & { [K in Key]: ServiceInfo<"transient", S> }>> => {
                (this.serviceInfo as Record<PropertyKey, ServiceInfo>)[key] = new ServiceInfoImpl("transient", lazy);
                return this as any;
            }
        } 
    }

    inject<P extends ServiceProvider>(provider: P): {
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(...keys: Keys): void 
    } {
        this.assertNotDisposed();
        return (...keys) => {
            this.implToDeps.set(provider, keys);
        }
    }
    
    resolve<Key extends keyof Services>(key: Key): ServiceInstance<Services[Key]["factory"]> {
        this.assertNotDisposed();
        const resolver = this._ensureResolverCached(key);
        return resolver();
    }

    child(): InjectionContainer<Services> {
        this.assertNotDisposed();

        const result = new InjectionContainerImpl();
        result.serviceInfo = {};

        const infoEntries = Object.entries(this.serviceInfo);
        for (const [k, v] of infoEntries) {
            const curr = v._derive();
            if (v.kind === "singleton") {
                const resolver = this._ensureResolverCached(k);
                result.resolverCache.set(k, resolver);
            }
            result.serviceInfo[k] = curr;
        }

        const depsEntries = this.implToDeps.entries();
        for (const [k, v] of depsEntries) {
            const curr = [...v];
            result.implToDeps.set(k, curr);
        }

        return result as InjectionContainer<Services>;
    }

    private _ensureResolverCached<Key extends keyof Services>(key: Key): () => ServiceInstance<Services[Key]["factory"]> {
        const cached = this.resolverCache.get(key);
        if (cached) return cached;

        const info = this.serviceInfo[key];
        if (!info) throw new Error(`No service for key '${String(key)}' found`);

        const depKeys = this.implToDeps.get(info.rawProvider) ?? [];

        let argResolvers = depKeys.map(depKey => this._ensureResolverCached(depKey));

        const resolve = () => info.factory(...argResolvers.map(r => r()));

        const resolver = (info.kind === "singleton" || info.kind === "scoped")
            ? (() => {
                const instance = resolve();
                return () => instance;
            })()
            : resolve;

        this.resolverCache.set(key, resolver);
        return resolver;
    }

    readonly dec: {
        inject<const Keys extends KeysForValues<Services, ServiceArgs<P>>, const P extends ServiceProvider>(
            ...keys: Keys
        ): (provider: P) => void;
    } = {
        inject: <const Keys extends KeysForValues<Services, ServiceArgs<P>>, const P extends ServiceProvider>(
            ...keys: Keys
        ): (provider: P) => void => {
            this.assertNotDisposed();
            return (provider) => {
                this.implToDeps.set(provider, keys);
            }
        }
    }

    private assertNotDisposed() {
        if (this.#disposed) throw new Error("Container has been disposed");
    }

    dispose(): void {
        if (this.#disposed) return;
        this.#disposed = true;

        this.serviceInfo = {};
        this.implToDeps.clear();
        this.resolverCache.clear();
    }

    [Symbol.dispose]() {
        this.dispose();
    }
}