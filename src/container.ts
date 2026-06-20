import {
    INJECTED,
    CTOR,
    FACTORY,
    ProviderKindKey,
    ProviderKindFromKey,
    SCOPE_MAP,
    ScopeKey,
    ScopeTokenFromKey,
    SINGLETON,
    TRANSIENT,
    PROVIDER,
} from "./const";
import {
    CtorWithArgKeys,
    ServiceContext,
    FactoryWithArgKeys,
    ProviderWithArgKeys,
} from "./context";
import {
    DepsNotFoundError,
    ServiceNotFoundError,
    SingletonOverrideError,
} from "./errors";
import {
    Ctor,
    Factory,
    KeyIfExtensible,
    KeysForValueTuple,
    MapToProperty,
    Pretty,
    InstanceRecord,
    ProviderTag,
    BroadenPrimitiveConst,
} from "./global";

export interface ServiceInfo<
    Provider extends ProviderWithArgKeys = ProviderWithArgKeys,
    ProviderKind extends ProviderKindKey = ProviderKindKey,
    Scope extends ScopeKey = ScopeKey,
> {
    readonly provider: Provider;
    readonly scope: ScopeTokenFromKey<Scope>;
    readonly providerKind: ProviderKindFromKey<ProviderKind>;
}

export interface ServiceContainerBuilder<
    ContextServices extends InstanceRecord,
    Services extends Record<PropertyKey, ServiceInfo> = {},
> {
    ctor<
        const K extends keyof ContextServices,
        const P extends CtorWithArgKeys<
            Ctor<ContextServices[K]>,
            MapToProperty<Services, "provider">,
            KeysForValueTuple<Services, any>
        >,
        const U extends ScopeKey,
    >(
        key: KeyIfExtensible<Services, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        ContextServices,
        Omit<Services, K> & {
            [Key in K]: ServiceInfo<P, "ctor", U>;
        }
    >;

    factory<
        const K extends keyof ContextServices,
        const P extends FactoryWithArgKeys<
            Factory<ContextServices[K]>,
            MapToProperty<Services, "provider">,
            KeysForValueTuple<Services, any>
        >,
        const U extends ScopeKey,
    >(
        key: KeyIfExtensible<Services, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        ContextServices,
        Omit<Services, K> & {
            [Key in K]: ServiceInfo<P, "factory", U>;
        }
    >;

    instance<
        const K extends keyof ContextServices,
        const I extends ContextServices[K],
        const U extends Exclude<ScopeKey, "transient">,
    >(
        key: KeyIfExtensible<Services, K>,
        instance: I,
        scope: U,
    ): ServiceContainerBuilder<
        ContextServices,
        Omit<Services, K> & {
            [Key in K]: ServiceInfo<
                Factory<BroadenPrimitiveConst<I>> & ProviderTag<[]>,
                "factory",
                U
            >;
        }
    >;

    build(): ServiceContainer<ContextServices, Pretty<Services>>;
}

export class ServiceContainerBuilderImpl<
    ContextServices extends InstanceRecord,
    Services extends Record<PropertyKey, ServiceInfo> = {},
> implements ServiceContainerBuilder<ContextServices, Services> {
    private readonly _context: ServiceContext<ContextServices>;
    private readonly _impl: Record<PropertyKey, ServiceInfo>;

    private readonly _resolvers: Map<PropertyKey, () => unknown>;

    constructor(
        context: ServiceContext<ContextServices>,
        impl: Services,
        resolvers: Map<PropertyKey, () => unknown> = new Map(),
    ) {
        this._context = context;
        this._impl = impl;
        this._resolvers = resolvers;
    }

    ctor<
        const K extends keyof ContextServices,
        const P extends CtorWithArgKeys<
            Ctor<ContextServices[K]>,
            MapToProperty<Services, "provider">,
            KeysForValueTuple<Services, any>
        >,
        const U extends ScopeKey,
    >(
        key: KeyIfExtensible<Services, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        ContextServices,
        Omit<Services, K> & {
            [Key in K]: ServiceInfo<P, "ctor", U>;
        }
    > {
        if (this._impl[key] && this._impl[key].scope === SINGLETON) {
            throw new SingletonOverrideError(key);
        }
        this._impl[key] = {
            provider,
            scope: SCOPE_MAP[scope],
            providerKind: CTOR,
        };
        return this as ServiceContainerBuilder<
            ContextServices,
            Omit<Services, K> & {
                [Key in K]: ServiceInfo<P, "ctor", U>;
            }
        >;
    }

    factory<
        const K extends keyof ContextServices,
        const P extends FactoryWithArgKeys<
            Factory<ContextServices[K]>,
            MapToProperty<Services, "provider">,
            KeysForValueTuple<Services, any>
        >,
        const U extends ScopeKey,
    >(
        key: KeyIfExtensible<Services, K>,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        ContextServices,
        Omit<Services, K> & {
            [Key in K]: ServiceInfo<P, "factory", U>;
        }
    > {
        if (this._impl[key] && this._impl[key].scope === SINGLETON) {
            throw new SingletonOverrideError(key);
        }
        this._impl[key] = {
            provider,
            scope: SCOPE_MAP[scope],
            providerKind: FACTORY,
        };
        return this as ServiceContainerBuilder<
            ContextServices,
            Omit<Services, K> & {
                [Key in K]: ServiceInfo<P, "factory", U>;
            }
        >;
    }

    instance<
        const K extends keyof ContextServices,
        const I extends ContextServices[K],
        const U extends ScopeKey,
    >(
        key: KeyIfExtensible<Services, K>,
        instance: I,
        scope: U,
    ): ServiceContainerBuilder<
        ContextServices,
        Omit<Services, K> & {
            [Key in K]: ServiceInfo<
                (() => I) & { [INJECTED]: []; [PROVIDER]: true },
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
                [PROVIDER]: true,
            }) as any,
            scope: SCOPE_MAP[scope],
            providerKind: FACTORY,
        };
        return this as ServiceContainerBuilder<
            ContextServices,
            Omit<Services, K> & {
                [Key in K]: ServiceInfo<
                    (() => I) & { [INJECTED]: []; [PROVIDER]: true },
                    "factory",
                    U
                >;
            }
        >;
    }

    build(): ServiceContainer<ContextServices, Pretty<Services>> {
        return new ServiceContainerImpl(
            this._context,
            this._impl as Services,
            this._resolvers,
        );
    }
}

export interface ServiceContainer<
    ContextServices extends InstanceRecord,
    Services extends Record<PropertyKey, ServiceInfo>,
> {
    resolve<const K extends keyof ContextServices>(key: K): ContextServices[K];
    child(): ServiceContainerBuilder<ContextServices, Services>;
    scope(): ServiceContainer<ContextServices, Services>;
}

export class ServiceContainerImpl<
    ContextServices extends InstanceRecord,
    Services extends Record<PropertyKey, ServiceInfo>,
> implements ServiceContainer<ContextServices, Services> {
    private readonly _context: ServiceContext<ContextServices>;
    private readonly _impl: Record<PropertyKey, ServiceInfo>;

    private readonly _resolvers: Map<PropertyKey, () => unknown>;

    constructor(
        context: ServiceContext<ContextServices>,
        impl: Services,
        resolvers: Map<PropertyKey, () => unknown> = new Map(),
    ) {
        this._context = context;
        this._impl = impl;
        this._resolvers = resolvers;
    }

    resolve<const K extends keyof ContextServices>(key: K): ContextServices[K] {
        const resolver = this._ensureResolverCached(key);
        return resolver() as ContextServices[K];
    }

    child(): ServiceContainerBuilder<ContextServices, Services> {
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

    scope(): ServiceContainer<ContextServices, Services> {
        return this.child().build();
    }

    private _ensureResolverCached<const K extends keyof ContextServices>(
        key: K,
    ): () => unknown {
        const cached = this._resolvers.get(key);
        if (cached) return cached as any;

        const impl = this._impl[key];
        if (!impl) throw new ServiceNotFoundError(key);

        const deps: PropertyKey[] | undefined = impl.provider[INJECTED];
        if (!deps) throw new DepsNotFoundError(key);

        const argResolvers = deps.map((k) =>
            this._ensureResolverCached(k as keyof ContextServices),
        );

        let resolve: () => unknown;

        const isFactory = impl.providerKind === FACTORY;
        const provider = impl.provider as any;

        switch (argResolvers.length) {
            case 0: {
                resolve = isFactory ? () => provider() : () => new provider();
                break;
            }
            case 1: {
                const [r0] = argResolvers;
                resolve = isFactory
                    ? () => provider(r0())
                    : () => new provider(r0());
                break;
            }
            case 2: {
                const [r0, r1] = argResolvers;
                resolve = isFactory
                    ? () => provider(r0(), r1())
                    : () => new provider(r0(), r1());
                break;
            }
            case 3: {
                const [r0, r1, r2] = argResolvers;
                resolve = isFactory
                    ? () => provider(r0(), r1(), r2())
                    : () => new provider(r0(), r1(), r2());
                break;
            }
            case 4: {
                const [r0, r1, r2, r3] = argResolvers;
                resolve = isFactory
                    ? () => provider(r0(), r1(), r2(), r3())
                    : () => new provider(r0(), r1(), r2(), r3());
                break;
            }
            case 5: {
                const [r0, r1, r2, r3, r4] = argResolvers;
                resolve = isFactory
                    ? () => provider(r0(), r1(), r2(), r3(), r4())
                    : () => new provider(r0(), r1(), r2(), r3(), r4());
                break;
            }
            case 6: {
                const [r0, r1, r2, r3, r4, r5] = argResolvers;
                resolve = isFactory
                    ? () => provider(r0(), r1(), r2(), r3(), r4(), r5())
                    : () => new provider(r0(), r1(), r2(), r3(), r4(), r5());
                break;
            }
            case 7: {
                const [r0, r1, r2, r3, r4, r5, r6] = argResolvers;
                resolve = isFactory
                    ? // prettier-ignore
                      () => provider(r0(), r1(), r2(), r3(), r4(), r5(), r6())
                    : // prettier-ignore
                      () => new provider(r0(), r1(), r2(), r3(), r4(), r5(), r6());
                break;
            }
            case 8: {
                const [r0, r1, r2, r3, r4, r5, r6, r7] = argResolvers;
                resolve = isFactory
                    ? // prettier-ignore
                      () => provider(r0(), r1(), r2(), r3(), r4(), r5(), r6(), r7())
                    : // prettier-ignore
                      () => new provider(r0(), r1(), r2(), r3(), r4(), r5(), r6(), r7());
                break;
            }
            default: {
                resolve = () =>
                    isFactory
                        ? () => provider(...argResolvers.map((r) => r()))
                        : () => new provider(...argResolvers.map((r) => r()));
                break;
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
