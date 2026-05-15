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
    Provider extends ConstructorOrFactory,
    Scope extends ServiceScopeKey,
> {
    readonly provider: Provider;
    readonly scope: (typeof ServiceScope)[Scope];
}

export interface ServiceContainerBuilder<
    C extends ServiceContext,
    T extends Record<PropertyKey, ConstructorOrFactory> = {},
    I extends Record<PropertyKey, ServiceScopeToken> = {},
    S extends Record<PropertyKey, ConstructorOrFactory> =
        C extends ServiceContext<infer U> ? U : never,
> {
    add<
        const K extends keyof S,
        const P extends ServiceProviderWithArgKeys<
            S[K],
            T,
            KeyTupleForBroadenedValueTuple<
                ConstructorOrFactoryMapToInstanceMap<T>,
                ConstructorOrFactoryArgs<S[K]>
            >
        >,
        const U extends ServiceScopeKey,
    >(
        key: K,
        provider: P,
        scope: U,
    ): ServiceContainerBuilder<
        C,
        Prettify<Omit<T, K> & { [Key in K]: P }>,
        Prettify<Omit<I, K> & { [Key in K]: U }>
    >;
}

export interface ServiceContainer<
    C extends ServiceContext,
    S extends Record<PropertyKey, ConstructorOrFactory>,
    I extends Record<PropertyKey, ServiceScopeToken>,
> {
    resolve<const K extends keyof S>(key: K): ConstructorOrFactoryReturn<S[K]>;
    child(): ServiceContainerBuilder<C, S, I>;
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
