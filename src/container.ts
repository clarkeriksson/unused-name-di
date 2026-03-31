import type { PrimitiveServiceInfo, ScopedServiceInfo, ServiceArgs, ServiceFactory, ServiceInfo, ServiceInstance, ServiceProvider, SingletonServiceInfo, TransientServiceInfo } from "./service.js";

/**
 * Utility type to simplify how built dict-like types render in IDE preview.
 */
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

/**
 * Type returning the broad primitive type for primitive const type inputs, otherwise the type passes through.
 */
type Generalize<T> = 
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
        [Key in keyof T]: Values[Index] extends Generalize<ServiceInstance<T[Key]["factory"]>> ? Key : never;
    }[keyof T];
};

/**
 * A dependency injection container. Multiple containers can exist.
 */
export interface InjectionContainer<
    Services extends Record<PropertyKey, ServiceInfo> = {}
> {
    /**
     * Begins the registration of a singleton service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a getter for the associated constructor or factory is
     * provided as an arg, and an optional generic type param can be provided to specify a broader type to register
     * the service as. 
     * 
     * **Singletons are globally respected unique instances, including across different containers. Since this is the
     * case, it is important to recognize that any non-singleton dependencies of this service will be derived from the
     * container it is registered in. Because of this it is recommended to only have singleton dependencies, but not
     * strictly prohibited by this library to allow for more freedom of use.**
     * 
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    singleton<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: SingletonServiceInfo<S> }>
            >;
    };

    /**
     * Begins the registration of a scoped service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a getter for the associated constructor or factory is
     * provided as an arg, and an optional generic type param can be provided to specify a broader type to register
     * the service as. 
     * 
     * **Scoped services behave as singletons for the container they inhabit.**
     * 
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    scoped<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: ScopedServiceInfo<S> }>
            >;
    };

    /**
     * Begins the registration of a transient service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a getter for the associated constructor or factory is
     * provided as an arg, and an optional generic type param can be provided to specify a broader type to register
     * the service as.
     * 
     * **Transient services are unique per resolve.**
     * 
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    transient<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: TransientServiceInfo<S> }>
            >;
    };

    /**
     * Begins the registration of a primitive service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a value will be provided for the primitive type.
     * Functionally equivalent to a singleton or transient service registered with a primitive value getter, but it is
     * advisable to register under this in those cases to be more descriptive and avoid ambiguity. It is likely
     * advisable to not use primitive services anyways, but the option exists.
     * 
     * **Primitive services implicitly function as global singletons, but less care can be taken with usage of these
     * due to their inherent lack of dependencies.**
     * 
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    primitive<Key extends PropertyKey>(key: Key): {
        use<S extends string | number | boolean | symbol | bigint | null | undefined>(value: S)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: PrimitiveServiceInfo<S> }>
            >;
    }

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
    private serviceInfo = {} as Services;
    private lazyProviders: Map<PropertyKey, () => ServiceProvider> = new Map();
    private implToDeps: Map<ServiceProvider, PropertyKey[]> = new Map();
    private resolverCache: Map<PropertyKey, () => any> = new Map();

    singleton<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: SingletonServiceInfo<S> }>
            >;
    } {
        return {
            use: <S>(lazy: () => ServiceProvider<S>): InjectionContainer<Prettify<Services & { [K in Key]: SingletonServiceInfo<S> }>> => {
                this.lazyProviders.set(key, lazy);
                (this.serviceInfo as Record<PropertyKey, ServiceInfo>)[key] = {
                    type: "singleton",
                    factory: null as any,
                    simple: true
                }
                return this as any;
            }
        } 
    }

    scoped<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: ScopedServiceInfo<S> }>
            >;
    } {
        return {
            use: <S>(lazy: () => ServiceProvider<S>): InjectionContainer<Prettify<Services & { [K in Key]: ScopedServiceInfo<S> }>> => {
                this.lazyProviders.set(key, lazy);
                (this.serviceInfo as Record<PropertyKey, ServiceInfo>)[key] = {
                    type: "scoped",
                    factory: null as any,
                    simple: true
                }
                return this as any;
            }
        } 
    }    

    transient<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: TransientServiceInfo<S> }>
            >;
    } {
        return {
            use: <S>(lazy: () => ServiceProvider<S>): InjectionContainer<Prettify<Services & { [K in Key]: TransientServiceInfo<S> }>> => {
                this.lazyProviders.set(key, lazy);
                (this.serviceInfo as Record<PropertyKey, ServiceInfo>)[key] = {
                    type: "transient",
                    factory: null as any,
                    simple: true
                }
                return this as any;
            }
        } 
    }

    primitive<Key extends PropertyKey>(key: Key): {
        use<S extends string | number | boolean | symbol | bigint | null | undefined>(value: S)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: PrimitiveServiceInfo<S> }>
            >;
    } {
        return {
            use: <S extends string | number | boolean | symbol | bigint | null | undefined>(value: S): InjectionContainer<Prettify<Services & { [K in Key]: PrimitiveServiceInfo<S> }>> => {
                this.lazyProviders.set(key, () => (() => value));
                (this.serviceInfo as Record<PropertyKey, ServiceInfo>)[key] = {
                    type: "primitive",
                    factory: () => value,
                    simple: true
                }
                return this as any;
            }
        } 
    }

    inject<P extends ServiceProvider>(provider: P): {
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(...keys: Keys): void 
    } {
        return (...keys) => {
            this.implToDeps.set(provider, keys);
        }
    }
    
    resolve<Key extends keyof Services>(key: Key): ServiceInstance<Services[Key]["factory"]> {
        const resolver = this._ensureResolverCached(key);
        return resolver();
    }

    child(): InjectionContainer<Services> {
        const result = new InjectionContainerImpl();
        result.serviceInfo = {} as Services;

        const infoEntries = Object.entries(this.serviceInfo);
        for (const [k, v] of infoEntries) {
            const curr = {
                type: v.type,
                factory: null as any,
                simple: true
            } as ServiceInfo;
            if (v.type === "singleton") {
                const resolver = this._ensureResolverCached(k);
                curr.factory = v.factory;
                (result as InjectionContainerImpl).resolverCache.set(k, resolver);
            }
            (result as any).serviceInfo[k] = curr;
        }

        const lazyProviderEntries = this.lazyProviders.entries();
        for (const [k, v] of lazyProviderEntries) {
            (result as InjectionContainerImpl).lazyProviders.set(k, v);
        }

        const depsEntries = this.implToDeps.entries();
        for (const [k, v] of depsEntries) {
            const curr = [...v];
            (result as InjectionContainerImpl).implToDeps.set(k, curr);
        }

        return result as any;
    }

    private _ensureResolverCached<Key extends keyof Services>(key: Key): () => ServiceInstance<Services[Key]["factory"]> {
        const cached = this.resolverCache.get(key);
        if (cached) return cached;

        const info = this.serviceInfo[key];
        if (!info) throw new Error(`No service for key '${String(key)}' found`);

        const lazy = this.lazyProviders.get(key);
        if (!lazy) throw new Error(`No service provider getter for key '${String(key)}' found`);

        (info as ServiceInfo).factory ??= InjectionContainerImpl.normalize(lazy());

        const depKeys = this.implToDeps.get(info.factory) ?? [];

        let argResolvers = depKeys.map(depKey => this._ensureResolverCached(depKey));

        info.simple = argResolvers.length === 0;

        const resolve = () => info.factory(...argResolvers.map(r => r()));

        const resolver = (info.type === "singleton" || info.type === "scoped")
            ? (() => {
                const instance = resolve();
                return () => instance;
            })()
            : resolve;

        this.resolverCache.set(key, resolver);
        return resolver;
    }

    readonly dec: {
        inject<const Keys extends KeysForValues<Services, ServiceArgs<P>>, P extends ServiceProvider>(
            ...keys: Keys
        ): (provider: P) => void;
    } = {
        inject: <const Keys extends KeysForValues<Services, ServiceArgs<P>>, const P extends ServiceProvider>(
            ...keys: Keys
        ): (provider: P) => void => {
            return (provider) => {
                this.implToDeps.set(provider, keys);
            }
        }
    }

    private static isClass(fn: unknown): fn is new (...args: any[]) => any {
        return typeof fn === "function" && !!fn.prototype?.constructor;
    }

    private static normalize<Service>(provider: ServiceProvider<Service>): ServiceFactory<Service> {
        if (InjectionContainerImpl.isClass(provider)) {
            return (...args: any[]) => new provider(...args);
        } else {
            return provider;
        }
    }

    dispose(): void {
        const _this = this as any;

        let keys = Object.keys(_this.serviceInfo);
        for (const key of keys) {
            let curr = _this.serviceInfo[key];
            curr.factory = null;
            if (curr.deps) {
                for (let i = 0; i < curr.deps.length; i++) {
                    curr.deps[i] = null;
                }
                curr.deps.length = 0;
            }
            curr = null;
            _this.serviceInfo[key] = null;
        }
        _this.serviceInfo = null;

        let lazyKeys = _this.lazyProviders.keys();
        for (const key of lazyKeys) {
            _this.lazyProviders.set(key, null);
        }
        _this.lazyProviders.clear();
        _this.lazyProviders = null;

        let depsKeys = _this.implToDeps.keys();
        for (const key of depsKeys) {
            let curr = _this.implToDeps.get(key);
            if (curr) {
                for (let i = 0; i < curr.length; i++) {
                    curr[i] = null;
                }
            }
            curr = null;
            curr.set(key, null);
        }
        _this.implToDeps.clear();
        _this.implToDeps = null;

        let resolverKeys = _this.resolverCache.keys();
        for (const key of resolverKeys) {
            _this.resolverCache.set(key, null);
        }
        _this.resolverCache.clear();

        /**
            private serviceInfo = {} as Services;
            private lazyProviders: Map<PropertyKey, () => ServiceProvider> = new Map();
            private implToDeps: Map<ServiceProvider, PropertyKey[]> = new Map();
            private resolverCache: Map<PropertyKey, () => any> = new Map();
         */
    }
}