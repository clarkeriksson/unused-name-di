import {
    ConstructorOrFactory,
    ConstructorOrFactoryArgs,
    KeyTupleForBroadenedValueTuple,
} from "./global";

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
