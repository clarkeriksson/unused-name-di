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

export declare type Constructor<
    T = unknown,
    Args extends readonly any[] = any[],
> = new (...args: Args) => T;
export declare type Factory<
    T = unknown,
    Args extends readonly any[] = any[],
> = (...args: Args) => T;

export declare type ConstructorArgs<T> =
    T extends Constructor<any, infer Args> ? Args : never;
export declare type FactoryArgs<T> =
    T extends Factory<any, infer Args> ? Args : never;

export declare type ConstructorReturn<T> =
    T extends Constructor<infer Return, any> ? Return : never;
export declare type FactoryReturn<T> =
    T extends Factory<infer Return, any> ? Return : never;

export declare type ConstructorOrFactory<
    T = unknown,
    Args extends readonly any[] = any[],
> = Constructor<T, Args> | Factory<T, Args>;

export declare type ConstructorOrFactoryArgs<T> = T extends Constructor
    ? ConstructorArgs<T>
    : T extends Factory
      ? FactoryArgs<T>
      : never;

export declare type ConstructorOrFactoryReturn<T> = T extends Constructor
    ? ConstructorReturn<T>
    : T extends Factory
      ? FactoryReturn<T>
      : never;

export declare type ConstructorOrFactoryMapToInstanceMap<
    T extends Record<PropertyKey, ConstructorOrFactory>,
> = {
    [K in keyof T]: ConstructorOrFactoryReturn<T[K]>;
};

export declare type KeyTupleForBroadenedValueTuple<
    T extends Record<PropertyKey, unknown>,
    V extends readonly any[],
> = {
    [I in keyof V]: {
        [K in keyof T]: BroadenPrimitiveConst<T[K]> extends V[I] ? K : never;
    }[keyof T];
};

export declare type MapToProperty<T, K extends keyof T[keyof T]> = {
    [Key in keyof T]: T[Key][K];
};
