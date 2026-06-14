import {
    INJECTED,
    CTOR,
    FACTORY,
    ProviderTypeKey,
    ProviderTypeTokenFromKey,
    SERVICE_SCOPE_MAP,
    ServiceScopeKey,
    ServiceScopeTokenFromKey,
    SINGLETON,
    TRANSIENT,
    UN_SERVICE_PROVIDER,
} from "./const";
import {
    ServiceConstructorWithArgKeys,
    ServiceContext,
    ServiceFactoryWithArgKeys,
    ServiceProviderWithArgKeys,
} from "./context";
import {
    DepsNotFoundError,
    ProviderTypeError,
    ServiceNotFoundError,
    SingletonOverrideError,
} from "./errors";
import {
    Constructor,
    ConstructorOrFactory,
    ConstructorOrFactoryArgs,
    ConstructorOrFactoryMapToInstanceMap,
    Factory,
    KeyIfNotExistingSingletonKey,
    KeyTupleForBroadenedValueTuple,
    MapToProperty,
    Prettify,
    ServiceInstanceRecord,
} from "./global";

export interface ContainerServiceInfo<
    Provider extends ServiceProviderWithArgKeys = ServiceProviderWithArgKeys,
    ProviderType extends ProviderTypeKey = ProviderTypeKey,
    Scope extends ServiceScopeKey = ServiceScopeKey,
> {
    readonly provider: Provider;
    readonly scope: ServiceScopeTokenFromKey<Scope>;
    readonly providerType: ProviderTypeTokenFromKey<ProviderType>;
}

export interface ServiceContainerBuilder<
    Services extends ServiceInstanceRecord,
    ContainerServices extends Record<PropertyKey, ContainerServiceInfo> = {},
> {
    ctor<
        const K extends keyof Services,
        const P extends ServiceConstructorWithArgKeys<
            Constructor<Services[K]>,
            MapToProperty<ContainerServices, "provider">,
            KeyTupleForBroadenedValueTuple<
                ConstructorOrFactoryMapToInstanceMap<
                    MapToProperty<ContainerServices, "provider">
                >,
                ConstructorOrFactoryArgs<ConstructorOrFactory<Services[K]>>
            >
        >,
        const U extends ServiceScopeKey,
    >(
        key: KeyIfNotExistingSingletonKey<ContainerServices, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Services,
        Omit<ContainerServices, K> & {
            [Key in K]: ContainerServiceInfo<P, "ctor", U>;
        }
    >;

    factory<
        const K extends keyof Services,
        const P extends ServiceFactoryWithArgKeys<
            Factory<Services[K]>,
            MapToProperty<ContainerServices, "provider">,
            KeyTupleForBroadenedValueTuple<
                ConstructorOrFactoryMapToInstanceMap<
                    MapToProperty<ContainerServices, "provider">
                >,
                ConstructorOrFactoryArgs<ConstructorOrFactory<Services[K]>>
            >
        >,
        const U extends ServiceScopeKey,
    >(
        key: KeyIfNotExistingSingletonKey<ContainerServices, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Services,
        Omit<ContainerServices, K> & {
            [Key in K]: ContainerServiceInfo<P, "factory", U>;
        }
    >;

    instance<
        const K extends keyof Services,
        const I extends Services[K],
        const U extends Exclude<ServiceScopeKey, "transient">,
    >(
        key: KeyIfNotExistingSingletonKey<ContainerServices, K>,
        instance: I,
        scope: U,
    ): ServiceContainerBuilder<
        Services,
        Omit<ContainerServices, K> & {
            [Key in K]: ContainerServiceInfo<
                (() => I) & { [INJECTED]: []; [UN_SERVICE_PROVIDER]: true },
                "factory",
                U
            >;
        }
    >;

    build(): ServiceContainer<Services, Prettify<ContainerServices>>;
}

export class ServiceContainerBuilderImpl<
    Services extends ServiceInstanceRecord,
    ContainerServices extends Record<PropertyKey, ContainerServiceInfo> = {},
> implements ServiceContainerBuilder<Services, ContainerServices> {
    private readonly _context: ServiceContext<Services>;
    private readonly _impl: Record<PropertyKey, ContainerServiceInfo>;

    private readonly _resolvers: Map<PropertyKey, () => unknown>;

    constructor(
        context: ServiceContext<Services>,
        impl: ContainerServices,
        resolvers: Map<PropertyKey, () => unknown> = new Map(),
    ) {
        this._context = context;
        this._impl = impl;
        this._resolvers = resolvers;
    }

    ctor<
        const K extends keyof Services,
        const P extends ServiceConstructorWithArgKeys<
            Constructor<Services[K]>,
            MapToProperty<ContainerServices, "provider">,
            KeyTupleForBroadenedValueTuple<
                ConstructorOrFactoryMapToInstanceMap<
                    MapToProperty<ContainerServices, "provider">
                >,
                ConstructorOrFactoryArgs<ConstructorOrFactory<Services[K]>>
            >
        >,
        const U extends ServiceScopeKey,
    >(
        key: KeyIfNotExistingSingletonKey<ContainerServices, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Services,
        Omit<ContainerServices, K> & {
            [Key in K]: ContainerServiceInfo<P, "ctor", U>;
        }
    > {
        if (this._impl[key] && this._impl[key].scope === SINGLETON) {
            throw new SingletonOverrideError(key);
        }
        this._impl[key] = {
            provider,
            scope: SERVICE_SCOPE_MAP[scope],
            providerType: CTOR,
        };
        return this as ServiceContainerBuilder<
            Services,
            Omit<ContainerServices, K> & {
                [Key in K]: ContainerServiceInfo<P, "ctor", U>;
            }
        >;
    }

    factory<
        const K extends keyof Services,
        const P extends ServiceFactoryWithArgKeys<
            Factory<Services[K]>,
            MapToProperty<ContainerServices, "provider">,
            KeyTupleForBroadenedValueTuple<
                ConstructorOrFactoryMapToInstanceMap<
                    MapToProperty<ContainerServices, "provider">
                >,
                ConstructorOrFactoryArgs<ConstructorOrFactory<Services[K]>>
            >
        >,
        const U extends ServiceScopeKey,
    >(
        key: KeyIfNotExistingSingletonKey<ContainerServices, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Services,
        Omit<ContainerServices, K> & {
            [Key in K]: ContainerServiceInfo<P, "factory", U>;
        }
    > {
        if (this._impl[key] && this._impl[key].scope === SINGLETON) {
            throw new SingletonOverrideError(key);
        }
        this._impl[key] = {
            provider,
            scope: SERVICE_SCOPE_MAP[scope],
            providerType: FACTORY,
        };
        return this as ServiceContainerBuilder<
            Services,
            Omit<ContainerServices, K> & {
                [Key in K]: ContainerServiceInfo<P, "factory", U>;
            }
        >;
    }

    instance<
        const K extends keyof Services,
        const I extends Services[K],
        const U extends ServiceScopeKey,
    >(
        key: KeyIfNotExistingSingletonKey<ContainerServices, K>,
        instance: I,
        scope: U,
    ): ServiceContainerBuilder<
        Services,
        Omit<ContainerServices, K> & {
            [Key in K]: ContainerServiceInfo<
                (() => I) & { [INJECTED]: []; [UN_SERVICE_PROVIDER]: true },
                "factory",
                U
            >;
        }
    > {
        if (this._impl[key] && this._impl[key].scope === SINGLETON) {
            throw new SingletonOverrideError(key);
        }
        this._impl[key] = {
            provider: Object.assign(() => instance, {
                [INJECTED]: [],
                [UN_SERVICE_PROVIDER]: true,
            }) as any,
            scope: SERVICE_SCOPE_MAP[scope],
            providerType: FACTORY,
        };
        return this as ServiceContainerBuilder<
            Services,
            Omit<ContainerServices, K> & {
                [Key in K]: ContainerServiceInfo<
                    (() => I) & { [INJECTED]: []; [UN_SERVICE_PROVIDER]: true },
                    "factory",
                    U
                >;
            }
        >;
    }

    build(): ServiceContainer<Services, Prettify<ContainerServices>> {
        return new ServiceContainerImpl(
            this._context,
            this._impl as ContainerServices,
            this._resolvers,
        );
    }
}

export interface ServiceContainer<
    Services extends ServiceInstanceRecord,
    ContainerServices extends Record<PropertyKey, ContainerServiceInfo>,
> {
    resolve<const K extends keyof Services>(key: K): Services[K];
    child(): ServiceContainerBuilder<Services, ContainerServices>;
}

export class ServiceContainerImpl<
    Services extends ServiceInstanceRecord,
    ContainerServices extends Record<PropertyKey, ContainerServiceInfo>,
> implements ServiceContainer<Services, ContainerServices> {
    private readonly _context: ServiceContext<Services>;
    private readonly _impl: Record<PropertyKey, ContainerServiceInfo>;

    private readonly _resolvers: Map<PropertyKey, () => unknown>;

    constructor(
        context: ServiceContext<Services>,
        impl: ContainerServices,
        resolvers: Map<PropertyKey, () => unknown> = new Map(),
    ) {
        this._context = context;
        this._impl = impl;
        this._resolvers = resolvers;
    }

    resolve<const K extends keyof Services>(key: K): Services[K] {
        const resolver = this._ensureResolverCached(key);
        return resolver() as Services[K];
    }

    child(): ServiceContainerBuilder<Services, ContainerServices> {
        const singletonResolvers = new Map<PropertyKey, () => unknown>();
        for (const [key, val] of Object.entries(this._impl)) {
            if (val.scope === SINGLETON) {
                const resolver = this._ensureResolverCached(key as any);
                singletonResolvers.set(key, resolver);
            }
        }
        const builder = new ServiceContainerBuilderImpl(
            this._context,
            { ...this._impl },
            singletonResolvers,
        );
        return builder;
    }

    private _ensureResolverCached<const K extends keyof Services>(
        key: K,
    ): () => unknown {
        const cached = this._resolvers.get(key);
        if (cached) return cached as any;

        const impl = this._impl[key];
        if (!impl) throw new ServiceNotFoundError(key);

        const deps: PropertyKey[] | undefined = impl.provider[INJECTED];
        if (!deps) throw new DepsNotFoundError(key);

        const argResolvers = deps.map((k) =>
            this._ensureResolverCached(k as keyof Services),
        );
        const resolveArgs = () => argResolvers.map((r) => r());

        let resolve: () => unknown;
        if (impl.providerType === FACTORY) {
            try {
                resolve = () => (impl.provider as Factory)(...resolveArgs());
            } catch {
                throw new ProviderTypeError(key, "factory");
            }
        } else {
            try {
                resolve = () =>
                    new (impl.provider as Constructor)(...resolveArgs());
            } catch {
                throw new ProviderTypeError(key, "class");
            }
        }

        const resolver =
            impl.scope === TRANSIENT
                ? resolve
                : (() => {
                      const instance = resolve();
                      return () => instance;
                  })();

        this._resolvers.set(key, resolver);
        return resolver;
    }
}
