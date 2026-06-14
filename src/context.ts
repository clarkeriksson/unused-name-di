import { INJECTED, UN_SERVICE_PROVIDER } from "./const";
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
    ServiceInstanceRecord,
} from "./global";

export interface ServiceContextBuilder<S extends ServiceInstanceRecord = {}> {
    forKey<const K extends PropertyKey>(
        key: NewKey<K, S>,
    ): {
        useType: <const T>() => ServiceContextBuilder<
            Prettify<
                S & {
                    [Key in K]: T;
                }
            >
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
    S extends ServiceInstanceRecord = {},
> implements ServiceContextBuilder<S> {
    _keys: Set<PropertyKey>;

    constructor() {
        this._keys = new Set();
    }

    forKey<const K extends PropertyKey>(
        key: NewKey<K, S>,
    ): {
        useType: <const T>() => ServiceContextBuilder<
            Prettify<
                S & {
                    [Key in K]: T;
                }
            >
        >;
    } {
        return {
            useType: <const T>() => {
                this._keys.add(key);
                return this as ServiceContextBuilder<
                    Prettify<
                        S & {
                            [Key in K]: T;
                        }
                    >
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

export interface ServiceContext<S extends ServiceInstanceRecord = {}> {
    inject<
        const C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            S,
            ConstructorOrFactoryArgs<C>
        >,
    >(
        provider: C,
        ...args: ConstructorOrFactoryArgs<C> extends [] ? [args?: A] : [args: A]
    ): C & { [INJECTED]: A; [UN_SERVICE_PROVIDER]: true };

    child(): ServiceContainerBuilder<S>;

    isProvider<
        C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            S,
            ConstructorOrFactoryArgs<C>
        >,
    >(
        value: C,
    ): value is C & { [INJECTED]: A; [UN_SERVICE_PROVIDER]: true };
}

export class ServiceContextImpl<
    S extends ServiceInstanceRecord = {},
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
    ): C & { [INJECTED]: A; [UN_SERVICE_PROVIDER]: true } {
        const argArr = (args[0] as A) ?? [];
        this._args.set(provider, argArr);
        return Object.assign(provider, {
            [INJECTED]: argArr,
            [UN_SERVICE_PROVIDER]: true as const,
        });
    }

    child(): ServiceContainerBuilder<S> {
        return new ServiceContainerBuilderImpl(this, {});
    }

    isProvider<
        C extends ConstructorOrFactory,
        const A extends KeyTupleForBroadenedValueTuple<
            S,
            ConstructorOrFactoryArgs<C>
        >,
    >(value: C): value is C & { [INJECTED]: A; [UN_SERVICE_PROVIDER]: true } {
        if (!(UN_SERVICE_PROVIDER in value)) return false;
        const args = this._args.get(value);
        if (!args) return false;
        return (
            INJECTED in value &&
            args.every((v, i) => v === (value[INJECTED] as any[])[i])
        );
    }
}

export type ServiceConstructorWithArgKeys<
    Provider extends Constructor = Constructor,
    Context extends ServiceInstanceRecord = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        ConstructorArgs<Provider>
    > = any,
> = Provider & {
    readonly [INJECTED]: Args;
    readonly [UN_SERVICE_PROVIDER]: true;
};

export type ServiceFactoryWithArgKeys<
    Provider extends Factory = Factory,
    Context extends ServiceInstanceRecord = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        FactoryArgs<Provider>
    > = any,
> = Provider & {
    readonly [INJECTED]: Args;
    readonly [UN_SERVICE_PROVIDER]: true;
};

export type ServiceProviderWithArgKeys<
    Provider extends ConstructorOrFactory = ConstructorOrFactory,
    Context extends ServiceInstanceRecord = any,
    Args extends KeyTupleForBroadenedValueTuple<
        Context,
        ConstructorOrFactoryArgs<Provider>
    > = any,
> = Provider & {
    readonly [INJECTED]: Args;
    readonly [UN_SERVICE_PROVIDER]: true;
};
