import type { PrimitiveServiceInfo, ServiceArgs, ServiceFactory, ServiceInfo, ServiceInstance, ServiceProvider, SingletonServiceInfo, TransientServiceInfo } from "./service.js";

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
        [Key in keyof T]: Values[Index] extends Generalize<ServiceInstance<T[Key]["service"]>> ? Key : never;
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
     * Begins the registration of a transient service assigned to the given key. This should always be followed by a
     * call to the 'use' method on the returned object, where a getter for the associated constructor or factory is
     * provided as an arg, and an optional generic type param can be provided to specify a broader type to register
     * the service as.
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
    resolve<Key extends keyof Services>(key: Key): ServiceInstance<Services[Key]["service"]>;
    
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
}

export class InjectionContainerImpl<
    Services extends Record<PropertyKey, ServiceInfo> = {}
> implements InjectionContainer<Services> {
    private readonly serviceInfo = {} as Services;
    private readonly lazyProviders: Map<PropertyKey, () => ServiceProvider> = new Map();
    private readonly implToDeps: Map<ServiceProvider, Set<PropertyKey>> = new Map();
    private readonly singletons: Map<PropertyKey, any> = new Map();

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
                    service: null as any,
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
                    service: null as any,
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
                    service: () => value,
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
            this.implToDeps.set(provider, new Set(keys));
        }
    }
    resolve<Key extends keyof Services>(key: Key): ServiceInstance<Services[Key]["service"]> {
        if (this.singletons.has(key)) {
            return this.singletons.get(key);
        }

        const info = this.serviceInfo[key];
        if (!info) throw new Error("No service info found");

        if (!info.service) {
            const lazy = this.lazyProviders.get(key);
            if (!lazy) throw new Error("No lazy service provider found");
            (info as any).service = InjectionContainerImpl.normalize(lazy());
        }

        const depKeys = this.implToDeps.get(info.service);
        const deps = Array.from(depKeys ?? []).map(k => this.resolve(k));

        const instance = info.service(...deps);

        if (info.type === "singleton") {
            this.singletons.set(key, instance);
        }

        return instance;
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
                this.implToDeps.set(provider, new Set(keys));
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
}