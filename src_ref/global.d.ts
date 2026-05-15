export declare type Prettify<T> = { [K in keyof T]: T[K] } & {};

export declare type BroadenPrimitiveConst<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends symbol
          ? symbol
          : T extends bigint
            ? bigint
            : T;

export declare type ConstructorOrFactory<
    T = unknown,
    Args extends readonly any[] = any[],
> = ((...args: Args) => T) | (new (...args: Args) => T);

export declare type ConstructorOrFactoryArgs<T extends ConstructorOrFactory> =
    T extends ConstructorOrFactory<unknown, infer A> ? A : never;

export declare type ConstructorOrFactoryReturn<T extends ConstructorOrFactory> =
    T extends ConstructorOrFactory<infer U, any[]> ? U : never;

export declare type KeyTupleForValueTuple<
    T extends Record<PropertyKey, unknown>,
    V extends readonly any[],
> = {
    [I in keyof V]: {
        [K in keyof T]: T[K] extends V[I] ? K : never;
    }[keyof T];
};

export declare type KeyTupleForBroadenedValueTuple<
    T extends Record<PropertyKey, unknown>,
    V extends readonly any[],
> = {
    [I in keyof V]: {
        [K in keyof T]: BroadenPrimitiveConst<T[K]> extends V[I] ? K : never;
    }[keyof T];
};
