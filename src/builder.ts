import type { ServiceArgs, ServiceFactory, ServiceInfo, ServiceInstance, ServiceProvider, SingletonServiceInfo, TransientServiceInfo } from "./service.js";

type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type KeysForValues<T extends Record<PropertyKey, ServiceInfo>, Values extends readonly any[]> = {
    [Index in keyof Values]: {
        [Key in keyof T]: Values[Index] extends ServiceInstance<T[Key]["service"]> ? Key : never;
    }[keyof T];
};

export interface InjectionContainer<
    Services extends Record<PropertyKey, ServiceInfo> = {}
> {
    singleton<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: SingletonServiceInfo<S> }>
            >;
    };
    transient<Key extends PropertyKey>(key: Key): {
        use<S>(lazy: () => ServiceProvider<S>)
            : InjectionContainer<
                Prettify<Services & { [K in Key]: TransientServiceInfo<S> }>
            >;
    };
    inject<P extends ServiceProvider>(provider: P): 
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(...keys: Keys) => void;
    resolve<Key extends keyof Services>(key: Key): ServiceInstance<Services[Key]["service"]>;
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