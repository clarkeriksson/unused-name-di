import { ARGS, UNUSED_NAME_SERVICE } from "./const";
import {
    ServiceContainerBuilder,
    ServiceContainerBuilderImpl,
} from "./container";
import {
    Constructor,
    ConstructorArgs,
    ConstructorOrFactory,
    ConstructorOrFactoryArgs,
    Factory,
    FactoryArgs,
    KeyTupleForBroadenedValueTuple,
    Prettify,
} from "./global";

export interface ServiceContextBuilder<
    S extends Record<PropertyKey, unknown> = {},
> {
    forKey<const K extends PropertyKey>(
        key: K,
    ): {
        useType: <const T>() => ServiceContextBuilder<
            Prettify<
                Omit<S, K> & {
                    [Key in K]: T;
                }
            >
        >;
    };

    build(): ServiceContext<S>;
}

export class ServiceContextBuilderImpl<
    S extends Record<PropertyKey, unknown> = {},
> implements ServiceContextBuilder<S> {
    private readonly _impls: Map<PropertyKey, ServiceProviderWithArgKeys[]>;

    constructor() {
        this._impls = new Map();
    }

    forKey<const K extends PropertyKey>(
        key: K,
    ): {
        useType: <const T>() => ServiceContextBuilder<
            Omit<S, K> & {
                [Key in K]: T;
            }
        >;
    } {
        return {
            useType: <const T>() => {
                this._impls.set(key, []);
                return this;
            },
        };
    }

    build(): ServiceContext<S> {
        const keys = new Set(this._impls.keys());
        return new ServiceContextImpl<S>(this._impls, keys);
    }
}

export interface ServiceContext<S extends Record<PropertyKey, unknown> = {}> {
    inject<
        const C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            S,
            ConstructorOrFactoryArgs<C>
        >,
    >(
        provider: C,
        args: A,
    ): ServiceProviderWithArgKeys<C, S, A>;

    child(): ServiceContainerBuilder<this>;
}

export type ServiceContextProviders<Context extends ServiceContext> =
    Context extends ServiceContext<infer S> ? S : never;

export class ServiceContextImpl<
    S extends Record<PropertyKey, unknown> = {},
> implements ServiceContext<S> {
    private readonly _impls: Map<PropertyKey, ServiceProviderWithArgKeys[]>;
    private readonly _keys: Set<PropertyKey>;
    private readonly _deps: Map<ConstructorOrFactory, PropertyKey[]>;

    constructor(
        impls: Map<PropertyKey, ServiceProviderWithArgKeys[]>,
        keys: Set<PropertyKey>,
    ) {
        this._impls = impls;
        this._keys = keys;
        this._deps = new Map();
    }

    inject<
        const C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            S,
            ConstructorOrFactoryArgs<C>
        >,
    >(provider: C, args: A): ServiceProviderWithArgKeys<C, S, A> {
        return Object.assign(provider, {
            [ARGS]: args,
            [UNUSED_NAME_SERVICE]: true as const,
        });
    }

    child(): ServiceContainerBuilder<this> {
        return new ServiceContainerBuilderImpl(this, {});
    }
}

export type ServiceConstructorWithArgKeys<
    Provider extends Constructor = Constructor,
    Context extends Record<PropertyKey, unknown> = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        ConstructorArgs<Provider>
    > = any,
> = Provider & {
    readonly [ARGS]: Args;
    readonly [UNUSED_NAME_SERVICE]: true;
};

export type ServiceFactoryWithArgKeys<
    Provider extends Factory = Factory,
    Context extends Record<PropertyKey, unknown> = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        FactoryArgs<Provider>
    > = any,
> = Provider & {
    readonly [ARGS]: Args;
    readonly [UNUSED_NAME_SERVICE]: true;
};

export type ServiceProviderWithArgKeys<
    Provider extends ConstructorOrFactory = ConstructorOrFactory,
    Context extends Record<PropertyKey, unknown> = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        ConstructorOrFactoryArgs<Provider>
    > = any,
> = Provider & {
    readonly [ARGS]: Args;
    readonly [UNUSED_NAME_SERVICE]: true;
};

// interface TesticleInterface {
//     test0: number;
//     test1: string;
// }

// class Testicle implements TesticleInterface {
//     test0: number;
//     test1: string;
//     constructor(test0: number, test1: string) {
//         this.test0 = test0;
//         this.test1 = test1;
//     }
// }

// type Test = ServiceProviderWithArgKeys<
//     typeof Testicle,
//     {
//         Service0Key: Testicle;
//         Num0: number;
//         Num1: number;
//         String0: string;
//     },
//     ["Num0", "String0"]
// >;

// // const ctx = new ServiceContextImpl<{
// //     Service0Key: typeof Testicle;
// //     Num0: () => number;
// //     Num1: () => number;
// //     String0: () => string;
// // }>(new Map(), new Set());

// const ctx = new ServiceContextBuilderImpl()
//     .forKey("Service0Key")
//     .useType<TesticleInterface>()
//     .forKey("Num0")
//     .useType<number>()
//     .forKey("Num1")
//     .useType<number>()
//     .forKey("String0")
//     .useType<string>()
//     .build();

// const test = ctx.inject(Testicle, ["Num0", "String0"]);
