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
    NewKey,
} from "./global";

export interface ServiceContextBuilder<
    S extends Record<PropertyKey, unknown> = {},
> {
    forKey<const K extends PropertyKey>(
        key: NewKey<K, S>,
    ): {
        useType: <const T>() => ServiceContextBuilder<
            S & {
                [Key in K]: T;
            }
        >;
    };

    useKeys<const K extends readonly PropertyKey[]>(
        ...keys: K
    ): {
        withTypeMap: <
            const M extends { [Key in K[number]]: unknown },
        >() => ServiceContextBuilder<M>;
    };

    build(): ServiceContext<S>;
}

export class ServiceContextBuilderImpl<
    S extends Record<PropertyKey, unknown> = {},
> implements ServiceContextBuilder<S> {
    _keys: Set<PropertyKey>;

    constructor() {
        this._keys = new Set();
    }

    forKey<const K extends PropertyKey>(
        key: NewKey<K, S>,
    ): {
        useType: <const T>() => ServiceContextBuilder<
            S & {
                [Key in K]: T;
            }
        >;
    } {
        return {
            useType: <const T>() => {
                this._keys.add(key);
                return this as ServiceContextBuilder<
                    S & {
                        [Key in K]: T;
                    }
                >;
            },
        };
    }

    useKeys<const K extends readonly PropertyKey[]>(
        ...keys: K
    ): {
        withTypeMap: <
            const M extends { [Key in K[number]]: unknown },
        >() => ServiceContextBuilder<M>;
    } {
        return {
            withTypeMap: <
                const M extends { [Key in K[number]]: unknown },
            >() => {
                for (const key of keys) {
                    this._keys.add(key);
                }
                return this as ServiceContextBuilder<M>;
            },
        };
    }

    build(): ServiceContext<S> {
        const keys = new Set(this._keys);
        return new ServiceContextImpl<S>(keys);
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
        ...args: ConstructorOrFactoryArgs<C> extends [] ? [args?: A] : [args: A]
    ): ServiceProviderWithArgKeys<C, S, A>;

    child(): ServiceContainerBuilder<this>;
}

export type ServiceContextProviders<Context extends ServiceContext> =
    Context extends ServiceContext<infer S> ? S : never;

export class ServiceContextImpl<
    S extends Record<PropertyKey, unknown> = {},
> implements ServiceContext<S> {
    _keys: Set<PropertyKey>;
    _args: Map<ConstructorOrFactory, PropertyKey[]>;

    constructor(keys: Set<PropertyKey>) {
        this._keys = keys;
        this._args = new Map();
    }

    inject<
        const C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            S,
            ConstructorOrFactoryArgs<C>
        >,
    >(
        provider: C,
        ...args: ConstructorOrFactoryArgs<C> extends [] ? [args?: A] : [args: A]
    ): ServiceProviderWithArgKeys<C, S, A> {
        const argArr = (args[0] as A) ?? [];
        this._args.set(provider, argArr);
        return Object.assign(provider, {
            [ARGS]: argArr,
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
