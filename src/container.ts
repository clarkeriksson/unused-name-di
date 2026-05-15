import {
    ARGS,
    ServiceScope,
    ServiceScopeKey,
    ServiceScopeToken,
} from "./const";
import { ServiceContext, ServiceProviderWithArgKeys } from "./context";
import {
    ConstructorOrFactory,
    ConstructorOrFactoryArgs,
    ConstructorOrFactoryMapToInstanceMap,
    ConstructorOrFactoryReturn,
    KeyTupleForBroadenedValueTuple,
    Prettify,
} from "./global";

export interface ContainerService<
    Provider extends ConstructorOrFactory = ConstructorOrFactory,
    Scope extends ServiceScopeKey = ServiceScopeKey,
> {
    readonly provider: Provider;
    readonly scope: (typeof ServiceScope)[Scope];
}

export type ContainerServiceProviderMap<
    Services extends Record<PropertyKey, ContainerService>,
> = {
    [K in keyof Services]: Services[K]["provider"];
};

export interface ServiceContainerBuilder<
    Context extends ServiceContext,
    Services extends Record<PropertyKey, ContainerService> = {},
> {
    add<
        const K extends Context extends ServiceContext<infer Providers>
            ? keyof Providers
            : never,
        const P extends Context extends ServiceContext<infer Providers>
            ? ServiceProviderWithArgKeys<
                  Providers[K],
                  ContainerServiceProviderMap<Services>,
                  KeyTupleForBroadenedValueTuple<
                      ConstructorOrFactoryMapToInstanceMap<
                          ContainerServiceProviderMap<Services>
                      >,
                      ConstructorOrFactoryArgs<Providers[K]>
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
}

export interface ServiceContainer<
    C extends ServiceContext,
    S extends Record<PropertyKey, ContainerService>,
> {
    resolve<const K extends keyof S>(
        key: K,
    ): ConstructorOrFactoryReturn<S[K]["provider"]>;
    child(): ServiceContainerBuilder<C, S>;
}

const Testicle = class {
    test0: number;
    test1: string;
    constructor(test0: number, test1: string) {
        this.test0 = test0;
        this.test1 = test1;
    }
};

type CtorMapTest = {
    Service0Key: typeof Testicle;
    Num0: () => number;
    Num1: () => number;
    String0: () => string;
};

const ctx = null as unknown as ServiceContext<CtorMapTest>;

const TesticleService = ctx.inject(Testicle, ["Num0", "String0"]);
const numService = ctx.inject(() => 1, []);
const strService = ctx.inject(() => "", []);

const test = (null as unknown as ServiceContainerBuilder<typeof ctx>)
    .add("Num0", numService, "scoped")
    .add("String0", strService, "singleton")
    .add("Service0Key", TesticleService, "transient");

type TestType =
    KeyTupleForBroadenedValueTuple<
        ConstructorOrFactoryMapToInstanceMap<CtorMapTest>,
        [number, string]
    > extends (keyof CtorMapTest)[]
        ? true
        : false;
