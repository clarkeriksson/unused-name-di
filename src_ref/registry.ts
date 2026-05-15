import { ServiceScopeKey } from "./const";
import {
    ConstructorOrFactory,
    ConstructorOrFactoryArgs,
    ConstructorOrFactoryReturn,
    KeyTupleForBroadenedValueTuple,
    Prettify,
} from "./global";

export interface ServiceContextBuilder<
    S extends Record<PropertyKey, unknown> = {},
> {
    forKey<const K extends string>(
        key: K,
    ): {
        useType<T>(): ServiceContextBuilder<
            Prettify<
                Omit<S, K> & {
                    [P in K]: T;
                }
            >
        >;
    };

    build(): ServiceContext<S>;
}

export class ServiceContextBuilderImpl<
    S extends Record<PropertyKey, unknown> = {},
> implements ServiceContextBuilder<S> {
    private readonly _keys: Set<string> = new Set();

    forKey<const K extends string>(
        key: K,
    ): {
        useType<T>(): ServiceContextBuilder<
            Prettify<
                Omit<S, K> & {
                    [P in K]: T;
                }
            >
        >;
    } {
        return {
            useType: <T>(): ServiceContextBuilder<
                Prettify<
                    Omit<S, K> & {
                        [P in K]: T;
                    }
                >
            > => {
                this._keys.add(key);
                return this;
            },
        };
    }

    build(): ServiceContext<S> {
        return new ServiceContextImpl<S>(this._keys);
    }
}

export interface ContainerServiceInfo<
    S extends ConstructorOrFactory = ConstructorOrFactory,
    K extends ServiceScopeKey = ServiceScopeKey,
> {
    readonly impl: ConstructorOrFactoryReturn<S>;
    readonly scope: K;
}

export class ContainerServiceInfoImpl<
    S extends ConstructorOrFactory,
    K extends ServiceScopeKey,
> implements ContainerServiceInfo<S, K> {
    readonly impl: ConstructorOrFactoryReturn<S>;
    readonly scope: K;

    constructor(impl: ConstructorOrFactoryReturn<S>, scope: K) {
        this.impl = impl;
        this.scope = scope;
    }
}

export interface ServiceContext<S extends Record<PropertyKey, unknown> = {}> {
    inject<T extends ConstructorOrFactory>(
        provider: T,
    ): {
        with: <
            const K extends KeyTupleForBroadenedValueTuple<
                S,
                ConstructorOrFactoryArgs<T>
            >,
        >(
            ...keys: K
        ) => void;
    };
}

export class ServiceContextImpl<
    S extends Record<PropertyKey, unknown> = {},
> implements ServiceContext<S> {
    private _keys: Set<string>;
    private readonly _deps: Map<ConstructorOrFactory, PropertyKey[]> =
        new Map();

    constructor(keys: Set<string>) {
        this._keys = keys;
    }

    inject<T extends ConstructorOrFactory>(
        provider: T,
    ): {
        with: <
            const K extends KeyTupleForBroadenedValueTuple<
                S,
                ConstructorOrFactoryArgs<T>
            >,
        >(
            ...keys: K
        ) => void;
    } {
        return {
            with: <
                const K extends KeyTupleForBroadenedValueTuple<
                    S,
                    ConstructorOrFactoryArgs<T>
                >,
            >(
                ...keys: K
            ) => {
                this._deps.set(provider, keys);
            },
        };
    }
}

export interface InjectionContainerBuilder<
    S extends Record<PropertyKey, ContainerServiceInfo>,
> {}

interface TestInterface0 {
    ksajdflkajsdf: true;
}

interface TestInterface1 {
    asdfdffsdsdf: true;
}

class TestClass {
    i0: TestInterface0;
    i1: TestInterface1;
    constructor(i0: TestInterface0, i1: TestInterface1) {
        this.i0 = i0;
        this.i1 = i1;
    }
}

//prettier-ignore
const b = new ServiceContextBuilderImpl()
    .forKey("Key0").useType<TestInterface0>()
    .forKey("Key1").useType<TestInterface1>()
    .forKey("Key2").useType<TestClass>()
    .build();

b.inject(TestClass).with("Key0", "Key1");
