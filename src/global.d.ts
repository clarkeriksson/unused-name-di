import { ARGS } from "./const";

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

export declare type ConstructorOrFactoryMapToInstanceMap<
    T extends Record<PropertyKey, ConstructorOrFactory>,
> = {
    [K in keyof T]: ConstructorOrFactoryReturn<T[K]>;
};

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

export declare type ServiceFactory<
    Service = any,
    Args extends any[] = any[],
> = (...args: Args) => Service;

export declare type ServiceConstructor<
    Service = any,
    Args extends any[] = any[],
> = new (...args: Args) => Service;

export declare type ServiceProvider<
    Service = any,
    Args extends any[] = any[],
> = ServiceFactory<Service, Args> | ServiceConstructor<Service, Args>;
