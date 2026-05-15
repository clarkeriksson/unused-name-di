import { ARGS, UNUSED_NAME_SERVICE } from "./const";
import {
    ConstructorOrFactory,
    ConstructorOrFactoryArgs,
    ConstructorOrFactoryMapToInstanceMap,
    ConstructorOrFactoryReturn,
    KeyTupleForBroadenedValueTuple,
} from "./global";

export interface ServiceContextBuilder<
    S extends Record<PropertyKey, ConstructorOrFactory> = {},
> {
    forKey<const K extends PropertyKey>(
        key: K,
    ): {
        useType: <const T>() => ServiceContextBuilder<
            Omit<S, K> & {
                [Key in K]: ConstructorOrFactory<T>;
            }
        >;
    };

    build(): ServiceContext<S>;
}

export class ServiceContextBuilderImpl<
    S extends Record<PropertyKey, ConstructorOrFactory> = {},
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
                [Key in K]: ConstructorOrFactory<T>;
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

export interface ServiceContext<
    S extends Record<PropertyKey, ConstructorOrFactory> = {},
    I extends Record<PropertyKey, unknown> = {
        [K in keyof S]: ConstructorOrFactoryReturn<S[K]>;
    },
> {
    inject<
        const C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            I,
            ConstructorOrFactoryArgs<C>
        >,
    >(
        provider: C,
        args: A,
    ): ServiceProviderWithArgKeys<C, S, A>;
}

export class ServiceContextImpl<
    S extends Record<PropertyKey, ConstructorOrFactory> = {},
    I extends Record<PropertyKey, unknown> = {
        [K in keyof S]: ConstructorOrFactoryReturn<S[K]>;
    },
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
            I,
            ConstructorOrFactoryArgs<C>
        >,
    >(provider: C, args: A): ServiceProviderWithArgKeys<C, S, A> {
        return Object.assign(provider, {
            [ARGS]: args,
            [UNUSED_NAME_SERVICE]: true as const,
        });
    }
}

export type ServiceProviderWithArgKeys<
    S extends ConstructorOrFactory = any,
    R extends Record<PropertyKey, ConstructorOrFactory> = any,
    A extends KeyTupleForBroadenedValueTuple<
        ConstructorOrFactoryMapToInstanceMap<R>,
        ConstructorOrFactoryArgs<S>
    > = any,
> = S & {
    readonly [ARGS]: A;
    readonly [UNUSED_NAME_SERVICE]: true;
};

class Testicle {
    test0: number;
    test1: string;
    constructor(test0: number, test1: string) {
        this.test0 = test0;
        this.test1 = test1;
    }
}

type Test = ServiceProviderWithArgKeys<
    typeof Testicle,
    {
        Service0Key: () => Testicle;
        Num0: () => number;
        Num1: () => number;
        String0: () => string;
    },
    ["Num0", "String0"]
>;

const ctx = new ServiceContextImpl<{
    Service0Key: typeof Testicle;
    Num0: () => number;
    Num1: () => number;
    String0: () => string;
}>(new Map(), new Set());

const test = ctx.inject(Testicle, ["Num0", "String0"]);
