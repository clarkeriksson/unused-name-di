import type { MissingServiceKeys, ServiceArgs, ServiceFactory, ServiceInfo, ServiceInfoLookup, ServiceInstance, ServiceKeysForServices, ServiceProvider, SingletonServiceInfo, TransientServiceInfo } from "./service.js";

type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type KeysForValues<T extends Record<PropertyKey, ServiceInfo>, Values extends readonly any[]> = {
    [Index in keyof Values]: {
        [Key in keyof T]: Values[Index] extends ServiceInstance<T[Key]["service"]> ? Key : never;
    }[keyof T];
};

export interface InjectionContainerBuilder<
    ExpectedServices extends readonly { key: PropertyKey, info: ServiceInfo }[] = readonly [],
    ServiceLookup extends Record<PropertyKey, ServiceInfo> = {}
> {
    singleton<const ServiceKey extends PropertyKey>(key: ServiceKey): {
        type: <ServiceType>() => InjectionContainerBuilder<
            readonly [...ExpectedServices, { key: ServiceKey, info: SingletonServiceInfo<ServiceType> }],
            Prettify<ServiceLookup & { [Key in ServiceKey]: SingletonServiceInfo<ServiceType> }>
        >;
    }
    transient<const ServiceKey extends PropertyKey>(key: ServiceKey): {
        type: <ServiceType>() => InjectionContainerBuilder<
            readonly [...ExpectedServices, { key: ServiceKey, info: TransientServiceInfo<ServiceType> }],
            Prettify<ServiceLookup & { [Key in ServiceKey]: TransientServiceInfo<ServiceType> }>
        >;
    }
    build<
        Providers extends { [Index in keyof ExpectedServices]: ServiceProvider<ServiceInstance<ExpectedServices[Index]["info"]["service"]>> }
    >(providers: Providers): InjectionContainer<ServiceLookup>;
    inject<const Provider extends ServiceProvider>(provider: Provider)
        : <const ServiceKeys extends KeysForValues<ServiceLookup, ServiceArgs<Provider>>>(...keys: ServiceKeys) => void
}

export interface InjectionContainer<
    ServiceLookup extends Record<PropertyKey, ServiceInfo>
> {
    resolve<const ServiceKey extends keyof ServiceLookup>(key: ServiceKey): ServiceInstance<ServiceLookup[ServiceKey]["service"]>;
}

export class BuilderImpl<
    ExpectedServices extends readonly { key: PropertyKey, info: ServiceInfo }[] = readonly [],
    ServiceLookup extends Record<PropertyKey, ServiceInfo> = {}
> implements InjectionContainerBuilder<ExpectedServices, ServiceLookup> {
    private readonly expected?: ExpectedServices = [] as any;
    private readonly services: ServiceLookup = {} as ServiceLookup;
    private readonly depMap: WeakMap<any, Set<PropertyKey>> = new WeakMap();
    
    singleton<const ServiceKey extends PropertyKey>(key: ServiceKey) {
        return {
            type: <ServiceType>() => {
                (this.expected as unknown as { key: PropertyKey, info: ServiceInfo }[]).push({
                    key,
                    info: {
                        type: "singleton",
                        service: null as any,
                        simple: true
                    }
                });
                return this as any;
            }
        }
    }

    transient<const ServiceKey extends PropertyKey>(key: ServiceKey) {
        return {
            type: <ServiceType>() => {
                (this.expected as unknown as { key: PropertyKey, info: ServiceInfo }[]).push({
                    key,
                    info: {
                        type: "transient",
                        service: null as any,
                        simple: true
                    }
                });
                return this as any;
            }
        }
    }

    inject<const Provider extends ServiceProvider>(provider: Provider): <const ServiceKeys extends KeysForValues<ServiceLookup, ServiceArgs<Provider>>>(...keys: ServiceKeys) => void {
        return (...keys) => {
            this.depMap.set(provider, new Set(keys));
        }
    }

    build<
        Providers extends { [Index in keyof ExpectedServices]: ServiceProvider<ServiceInstance<ExpectedServices[Index]["info"]["service"]>> }
    >(providers: Providers): InjectionContainer<ServiceLookup> {
        const container = new ContainerImpl<ServiceLookup>();

        for (let i = 0; i < providers.length; i++) {
            const curr = providers[i];
            (this.expected![i].info as any).service = BuilderImpl.normalize(curr);
        }

        (this.services as any) = Object.fromEntries(
            this.expected!.map(e => ([e.key, e.info]))
        );

        container._services = this.services;

        const infoItems = Object.entries(this.services);
        for (let i = 0; i < infoItems.length; i++) {
            const [k, info] = infoItems[i];
            if (!container._serviceToKey.has(info.service)) {
                container._serviceToKey.set(info.service, k);
            }

            const deps = this.depMap.get(info.service);
            if (!deps || deps.size === 0) continue;

            info.deps = Array.from(deps).map(dep => {
                const depInfo = this.services[dep];
                if (!depInfo) throw new Error("Dependency info not found");
                return () => container.resolve(dep);
            });
        }

        return container;
    };

    private static isClass(fn: unknown): fn is new (...args: any[]) => any {
        return typeof fn === "function" && !!fn.prototype?.constructor;
    }

    private static normalize<Service>(provider: ServiceProvider<Service>): ServiceFactory<Service> {
        if (BuilderImpl.isClass(provider)) {
            return (...args: any[]) => new provider(...args);
        } else {
            return provider;
        }
    }
}

class ContainerImpl<ServiceInfo extends ServiceInfoLookup = {}> implements InjectionContainer<ServiceInfo> {
    _serviceToKey: Map<ServiceProvider<any>, PropertyKey> = new Map();
    _services: ServiceInfo = {} as ServiceInfo;
    _singletons: Record<PropertyKey, any> = {};

    resolve<const ServiceKey extends keyof ServiceInfo>(key: ServiceKey): ServiceInstance<ServiceInfo[ServiceKey]["service"]> {
        const info = this._services[key];
        if (!info) throw new Error(`Unable to resolve service for key '${String(key ?? "N/A")}'`);

        if (info.type === "singleton") {
            const existing = this._singletons[key];
            if (existing) return existing;
        }
        
        let service: any;
        if (info.simple) {
            service = info.service();
        } else {
            const args = info.deps.map(d => d());
            service = info.service(...args);
        }

        if (info.type === "singleton") {
            this._singletons[key] = service;
        }

        return service;
    }
}