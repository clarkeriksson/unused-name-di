import {
    ARGS,
    SERVICE_SCOPE_MAP,
    ServiceScopeKey,
    ServiceScopeToken,
    SINGLETON,
    TRANSIENT,
} from "./const";
import {
    ServiceConstructorWithArgKeys,
    ServiceContext,
    ServiceContextProviders,
    ServiceFactoryWithArgKeys,
    ServiceProviderWithArgKeys,
} from "./context";
import {
    DepsNotFoundError,
    ProviderTypeError,
    ServiceNotFoundError,
} from "./errors";
import {
    Constructor,
    ConstructorOrFactory,
    ConstructorOrFactoryArgs,
    ConstructorOrFactoryMapToInstanceMap,
    ConstructorOrFactoryReturn,
    Factory,
    KeyTupleForBroadenedValueTuple,
    MapToProperty,
    Prettify,
} from "./global";

export interface ContainerService<
    Provider extends ServiceProviderWithArgKeys = ServiceProviderWithArgKeys,
    Scope extends ServiceScopeKey = ServiceScopeKey,
> {
    readonly provider: Provider;
    readonly scope: (typeof SERVICE_SCOPE_MAP)[Scope];
    readonly factory: boolean;
}

export interface ServiceContainerBuilder<
    Context extends ServiceContext,
    Services extends Record<PropertyKey, ContainerService> = {},
> {
    ctor<
        const K extends Context extends ServiceContext<infer Providers>
            ? keyof Providers
            : never,
        const P extends Context extends ServiceContext<infer Providers>
            ? ServiceConstructorWithArgKeys<
                  Constructor<Providers[K]>,
                  MapToProperty<Services, "provider">,
                  KeyTupleForBroadenedValueTuple<
                      ConstructorOrFactoryMapToInstanceMap<
                          MapToProperty<Services, "provider">
                      >,
                      ConstructorOrFactoryArgs<
                          ConstructorOrFactory<Providers[K]>
                      >
                  >
              >
            : never,
        const U extends ServiceScopeKey,
    >(
        key: K,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Context,
        Prettify<Omit<Services, K> & { [Key in K]: ContainerService<P, U> }>
    >;

    factory<
        const K extends Context extends ServiceContext<infer Providers>
            ? keyof Providers
            : never,
        const P extends Context extends ServiceContext<infer Providers>
            ? ServiceFactoryWithArgKeys<
                  Factory<Providers[K]>,
                  MapToProperty<Services, "provider">,
                  KeyTupleForBroadenedValueTuple<
                      ConstructorOrFactoryMapToInstanceMap<
                          MapToProperty<Services, "provider">
                      >,
                      ConstructorOrFactoryArgs<
                          ConstructorOrFactory<Providers[K]>
                      >
                  >
              >
            : never,
        const U extends ServiceScopeKey,
    >(
        key: K,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Context,
        Prettify<Omit<Services, K> & { [Key in K]: ContainerService<P, U> }>
    >;

    build(): ServiceContainer<Context, Services>;
}

export class ServiceContainerBuilderImpl<
    Context extends ServiceContext,
    Services extends Record<PropertyKey, ContainerService> = {},
> implements ServiceContainerBuilder<Context, Services> {
    private readonly _context: Context;
    private readonly _impl: Record<PropertyKey, ContainerService>;

    constructor(context: Context, impl: Services) {
        this._context = context;
        this._impl = impl;
    }

    ctor<
        const K extends Context extends ServiceContext<infer Providers>
            ? keyof Providers
            : never,
        const P extends Context extends ServiceContext<infer Providers>
            ? ServiceConstructorWithArgKeys<
                  Constructor<Providers[K]>,
                  MapToProperty<Services, "provider">,
                  KeyTupleForBroadenedValueTuple<
                      ConstructorOrFactoryMapToInstanceMap<
                          MapToProperty<Services, "provider">
                      >,
                      ConstructorOrFactoryArgs<
                          ConstructorOrFactory<Providers[K]>
                      >
                  >
              >
            : never,
        const U extends ServiceScopeKey,
    >(
        key: K,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Context,
        Prettify<Omit<Services, K> & { [Key in K]: ContainerService<P, U> }>
    > {
        if (this._impl[key]) {
            console.log("overriding", key);
        }
        this._impl[key] = {
            provider,
            scope: SERVICE_SCOPE_MAP[scope],
            factory: false,
        };
        return this as ServiceContainerBuilder<
            Context,
            Prettify<Omit<Services, K> & { [Key in K]: ContainerService<P, U> }>
        >;
    }

    factory<
        const K extends Context extends ServiceContext<infer Providers>
            ? keyof Providers
            : never,
        const P extends Context extends ServiceContext<infer Providers>
            ? ServiceFactoryWithArgKeys<
                  Factory<Providers[K]>,
                  MapToProperty<Services, "provider">,
                  KeyTupleForBroadenedValueTuple<
                      ConstructorOrFactoryMapToInstanceMap<
                          MapToProperty<Services, "provider">
                      >,
                      ConstructorOrFactoryArgs<
                          ConstructorOrFactory<Providers[K]>
                      >
                  >
              >
            : never,
        const U extends ServiceScopeKey,
    >(
        key: K,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        Context,
        Prettify<Omit<Services, K> & { [Key in K]: ContainerService<P, U> }>
    > {
        if (this._impl[key]) {
            console.log("overriding", key);
        }
        this._impl[key] = {
            provider,
            scope: SERVICE_SCOPE_MAP[scope],
            factory: true,
        };
        return this as ServiceContainerBuilder<
            Context,
            Prettify<Omit<Services, K> & { [Key in K]: ContainerService<P, U> }>
        >;
    }

    build(): ServiceContainer<Context, Services> {
        return new ServiceContainerImpl(this._context, this._impl as Services);
    }
}

export interface ServiceContainer<
    Context extends ServiceContext,
    Services extends Record<PropertyKey, ContainerService>,
> {
    resolve<const K extends keyof ServiceContextProviders<Context>>(
        key: K,
    ): ServiceContextProviders<Context>[K];
    child(): ServiceContainerBuilder<Context, Services>;
}

export class ServiceContainerImpl<
    Context extends ServiceContext,
    Services extends Record<PropertyKey, ContainerService>,
> implements ServiceContainer<Context, Services> {
    private readonly _context: Context;
    private readonly _impl: Record<PropertyKey, ContainerService>;

    private readonly _resolvers: Map<PropertyKey, () => unknown>;

    constructor(context: Context, impl: Services) {
        this._context = context;
        this._impl = impl;
        this._resolvers = new Map();
    }

    resolve<const K extends keyof ServiceContextProviders<Context>>(
        key: K,
    ): ServiceContextProviders<Context>[K] {
        const resolver = this._ensureResolverCached(key);
        return resolver() as ServiceContextProviders<Context>[K];
    }

    child(): ServiceContainerBuilder<Context, Services> {
        const builder = new ServiceContainerBuilderImpl(
            this._context,
            this._impl,
        );
        return builder;
    }

    private _ensureResolverCached<
        const K extends keyof ServiceContextProviders<Context>,
    >(key: K): () => unknown {
        const cached = this._resolvers.get(key);
        if (cached) return cached as any;

        const impl = this._impl[key];
        if (!impl) throw new ServiceNotFoundError(key);

        const deps: PropertyKey[] | undefined = impl.provider[ARGS];
        if (!deps) throw new DepsNotFoundError(key);

        const argResolvers = deps.map((k) =>
            this._ensureResolverCached(
                k as keyof ServiceContextProviders<Context>,
            ),
        );
        const resolveArgs = () => argResolvers.map((r) => r());

        console.log(impl);

        let resolve: () => unknown;
        if (impl.factory) {
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

// interface TesticleInterface {
//     test0: number;
//     test1: string;
// }

// class Testicle {
//     test0: number;
//     test1: string;
//     constructor(test0: number, test1: string) {
//         this.test0 = test0;
//         this.test1 = test1;
//     }
// }

// type CtorMapTest = {
//     Service0Key: TesticleInterface;
//     Num0: number;
//     Num1: number;
//     String0: string;
// };

// const ctx = null as unknown as ServiceContext<CtorMapTest>;

// const TesticleService = ctx.inject(Testicle, ["Num0", "String0"]);
// const numService = ctx.inject(() => 1, []);
// const strService = ctx.inject(() => "", []);

// const test = (null as unknown as ServiceContainerBuilder<typeof ctx>)
//     .factory("Num0", numService, "scoped")
//     .factory("String0", strService, "singleton")
//     .ctor("Service0Key", TesticleService, "transient");
