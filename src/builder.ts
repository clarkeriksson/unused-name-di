import type { MissingServiceKeys, ServiceArgs, ServiceFactory, ServiceInfoLookup, ServiceInstance, ServiceKeysForServices, ServiceLookup, ServiceProvider, SingletonServiceInfo, TransientServiceInfo } from "./service.js";

type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

declare const SERVICE_IMPL: unique symbol;
declare const SERVICE_TYPE: unique symbol;
type ServiceToken<Interface, Type extends Interface> = symbol & { [SERVICE_TYPE]: Interface, [SERVICE_IMPL]: Type };
const _token = <Interface, Type extends Interface>() => Symbol() as ServiceToken<Interface, Type>;

export interface InjectionContainerBuilder<
    Services extends ServiceLookup,
    ServiceInfo extends ServiceInfoLookup = {}
> {
    singleton<const ServiceKey extends keyof Services>(key: ServiceKey): {
        use<Service extends Services[ServiceKey]>(provider: ServiceProvider<Service>)
            : InjectionContainerBuilder<
                Services, 
                Prettify<ServiceInfo & { [Key in ServiceKey]: SingletonServiceInfo<Service> }>
            >;
    };
    transient<const ServiceKey extends keyof Services>(key: ServiceKey): {
        use<Service extends Services[ServiceKey]>(provider: ServiceProvider<Service>)
            : InjectionContainerBuilder<
                Services, 
                Prettify<ServiceInfo & { [Key in ServiceKey]: TransientServiceInfo<Service> }>
            >;
    };
    build: MissingServiceKeys<Services, ServiceInfo> extends never ? () => InjectionContainer<ServiceInfo> : never;
    inject<const ServiceKeys extends ServiceKeysForServices<Services, ServiceArgs<Provider>>, Provider extends ServiceProvider>(
        ...keys: ServiceKeys
    ): (provider: Provider) => void;
}

export interface InjectionContainer<
    ServiceInfo extends ServiceInfoLookup
> {
    resolve<const ServiceKey extends keyof ServiceInfo>(key: ServiceKey): ServiceInstance<ServiceInfo[ServiceKey]["service"]>;
}

export class BuilderImpl<
    Services extends ServiceLookup,
    ServiceInfo extends ServiceInfoLookup = {}
> implements InjectionContainerBuilder<Services, ServiceInfo> {
    private readonly services: ServiceInfo = {} as ServiceInfo;
    private readonly depMap: WeakMap<any, Set<PropertyKey>> = new WeakMap();
    
    singleton<const ServiceKey extends keyof Services>(key: ServiceKey) {
        return {
            use: <Service>(provider: ServiceProvider<Service>) => {
                (this.services as ServiceInfoLookup)[key] = {
                    type: "singleton",
                    service: BuilderImpl.normalize(provider),
                    simple: true
                }
                return this as any;
            }
        }
    }

    transient<const ServiceKey extends keyof Services>(key: ServiceKey) {
        return {
            use: <Service>(provider: ServiceProvider<Service>) => {
                (this.services as ServiceInfoLookup)[key] = {
                    type: "transient",
                    service: BuilderImpl.normalize(provider),
                    simple: true
                }
                return this as any;
            }
        }
    }

    inject<ServiceKeys extends ServiceKeysForServices<Services, ServiceArgs<Provider>>, Provider extends ServiceProvider>(
        ...keys: ServiceKeys
    ): (provider: Provider) => void {
        return provider => {
            this.depMap.set(provider, new Set(keys));
        }
    }

    build = ((): InjectionContainer<ServiceInfo> => {
        const container = new ContainerImpl<ServiceInfo>();

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
    }) as MissingServiceKeys<Services, ServiceInfo> extends never ? () => InjectionContainer<ServiceInfo> : never;

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