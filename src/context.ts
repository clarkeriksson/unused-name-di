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
    Prettify,
    ServiceInstance,
} from "./global";

export interface ServiceContextBuilder<
    S extends Record<PropertyKey, ServiceInstance> = {},
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
            const M extends { [Key in K[number]]: ServiceInstance },
        >() => ServiceContextBuilder<M>;
    };

    build(): ServiceContext<Prettify<S>>;
}

export class ServiceContextBuilderImpl<
    S extends Record<PropertyKey, ServiceInstance> = {},
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
            const M extends { [Key in K[number]]: ServiceInstance },
        >() => ServiceContextBuilder<M>;
    } {
        return {
            withTypeMap: <
                const M extends { [Key in K[number]]: ServiceInstance },
            >() => {
                for (const key of keys) {
                    this._keys.add(key);
                }
                return this as unknown as ServiceContextBuilder<M>;
            },
        };
    }

    build(): ServiceContext<Prettify<S>> {
        const keys = new Set(this._keys);
        return new ServiceContextImpl<Prettify<S>>(keys);
    }
}

export interface ServiceContext<
    S extends Record<PropertyKey, ServiceInstance> = {},
> {
    inject<
        const C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            S,
            ConstructorOrFactoryArgs<C>
        >,
    >(
        provider: C,
        ...args: ConstructorOrFactoryArgs<C> extends [] ? [args?: A] : [args: A]
    ): C & { [ARGS]: A };

    child(): ServiceContainerBuilder<S>;
}

export class ServiceContextImpl<
    S extends Record<PropertyKey, ServiceInstance> = {},
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
    ): C & { [ARGS]: A } {
        const argArr = (args[0] as A) ?? [];
        this._args.set(provider, argArr);
        return Object.assign(provider, {
            [ARGS]: argArr,
            [UNUSED_NAME_SERVICE]: true as const,
        });
    }

    child(): ServiceContainerBuilder<S> {
        return new ServiceContainerBuilderImpl(this, {});
    }
}

export type ServiceConstructorWithArgKeys<
    Provider extends Constructor = Constructor,
    Context extends Record<PropertyKey, ServiceInstance> = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        ConstructorArgs<Provider>
    > = any,
> = Provider & {
    readonly [ARGS]: Args;
};

export type ServiceFactoryWithArgKeys<
    Provider extends Factory = Factory,
    Context extends Record<PropertyKey, ServiceInstance> = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        FactoryArgs<Provider>
    > = any,
> = Provider & {
    readonly [ARGS]: Args;
};

export type ServiceProviderWithArgKeys<
    Provider extends ConstructorOrFactory = ConstructorOrFactory,
    Context extends Record<PropertyKey, ServiceInstance> = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        ConstructorOrFactoryArgs<Provider>
    > = any,
> = Provider & {
    readonly [ARGS]: Args;
};
