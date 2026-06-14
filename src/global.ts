import { ProviderTypeKey, ServiceScopeKey } from "./const";
import { ContainerServiceInfo } from "./container";

/**
 * Type improving the mouseover preview of the argument type.
 * @param T
 */
export declare type Prettify<T> = { [K in keyof T]: T[K] } & {};

/** Semantic type representing a service instance type. */
export declare type ServiceInstance = unknown;

/** Semantic type representing a record from service keys to their assigned instance types. */
export declare type ServiceInstanceRecord = Record<
    PropertyKey,
    ServiceInstance
>;

/**
 * Broadens primitive const types to their fully broadened js primitive type, and passes all other types through.
 * @param T
 */
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

/**
 * Type representing the constructor of instance type {@link T} that takes inputs of type {@link Args}.
 * @param T The instance type.
 * @param Args The argument tuple type.
 */
export declare type Constructor<
    T = unknown,
    Args extends readonly any[] = readonly any[],
> = new (...args: Args) => T;

/**
 * Type representing the factory of instance type {@link T} that takes inputs of type {@link Args}.
 * @param T The instance type.
 * @param Args The argument tuple type.
 */
export declare type Factory<
    T = unknown,
    Args extends readonly any[] = readonly any[],
> = (...args: Args) => T;

/**
 * Type extracting the arguments from {@link Constructor} type {@link T}.
 * @param T
 */
export declare type ConstructorArgs<T> =
    T extends Constructor<any, infer Args> ? Args : never;

/**
 * Type extracting the arguments from {@link Factory} type {@link T}.
 * @param T
 */
export declare type FactoryArgs<T> =
    T extends Factory<any, infer Args> ? Args : never;

/**
 * Type extracting the return type from {@link Constructor} type {@link T}.
 * @param T
 */
export declare type ConstructorReturn<T> =
    T extends Constructor<infer Return, any> ? Return : never;

/**
 * Type extracting the return type from {@link Factory} type {@link T}.
 * @param T
 */
export declare type FactoryReturn<T> =
    T extends Factory<infer Return, any> ? Return : never;

/**
 * Type representing the constructor or factory of instance type {@link T} that takes inputs of type {@link Args}.
 * @param T The instance type.
 * @param Args The argument tuple type.
 */
export declare type ConstructorOrFactory<
    T = unknown,
    Args extends readonly any[] = any[],
> = Constructor<T, Args> | Factory<T, Args>;

/**
 * Type extracting the arguments from {@link Constructor} or {@link Factory} type {@link T}.
 * @param T
 */
export declare type ConstructorOrFactoryArgs<T> = T extends Constructor
    ? ConstructorArgs<T>
    : T extends Factory
      ? FactoryArgs<T>
      : never;

/**
 * Type extracting the return type from {@link Constructor} or {@link Factory} type {@link T}.
 * @param T
 */
export declare type ConstructorOrFactoryReturn<T> = T extends Constructor
    ? ConstructorReturn<T>
    : T extends Factory
      ? FactoryReturn<T>
      : never;

/**
 * Type that transforms a {@link Record} type with {@link ConstructorOrFactory} values into a {@link Record} type with {@link ConstructorOrFactoryReturn} values.
 * @param T The {@link Record} type with {@link ConstructorOrFactory} values to convert.
 */
export declare type ConstructorOrFactoryMapToInstanceMap<
    T extends Record<PropertyKey, ConstructorOrFactory>,
> = {
    [K in keyof T]: ConstructorOrFactoryReturn<T[K]>;
};

/**
 * Type that returns a tuple type of keys that correspond to values assignable to types {@link V} based on the {@link Record} type {@link T}.
 * @param T The {@link Record} type mapping keys to value types.
 * @param V The value tuple to retrieve keys for.
 */
export declare type KeyTupleForBroadenedValueTuple<
    T extends Record<PropertyKey, unknown>,
    V extends readonly any[],
> = {
    [I in keyof V]: {
        [K in keyof T]: BroadenPrimitiveConst<T[K]> extends V[I] ? K : never;
    }[keyof T];
};

/**
 * Type that transforms a {@link Record} type with a uniform value type to a {@link Record} type of an object property of that uniform value type.
 * @param T
 * @param K The key to extract from the property values of type {@link T}.
 */
export declare type MapToProperty<T, K extends keyof T[keyof T]> = {
    [Key in keyof T]: T[Key][K];
};

/**
 * Type that finds all {@link ContainerServiceInfo} keys associated with a {@link ContainerServiceInfo} the has a {@link ContainerServiceInfo.scope scope} assignable to the given {@link Scope} type parameter in the {@link Services} {@link Record} type.
 * @param Services The {@link Record} type with {@link ContainerServiceInfo} values.
 * @param Scope The {@link ServiceScopeKey} to filter by.
 */
export declare type ServiceScopeKeys<
    Services extends Record<PropertyKey, ContainerServiceInfo>,
    Scope extends ServiceScopeKey,
> = {
    [Key in keyof Services]: Services[Key] extends ContainerServiceInfo<
        any,
        ProviderTypeKey,
        Scope
    >
        ? Key
        : never;
}[keyof Services];

/**
 * Type that returns the provided {@link Key} type if it is not already associated with a {@link ContainerServiceInfo} with {@link ContainerServiceInfo.scope scope} value of singleton.
 * @param Services The {@link Record} type with {@link ContainerServiceInfo} values.
 * @param Key The key to conditionally pass through.
 */
export declare type KeyIfNotExistingSingletonKey<
    Services extends Record<PropertyKey, ContainerServiceInfo>,
    Key extends PropertyKey,
> = Key extends ServiceScopeKeys<Services, "singleton"> ? never : Key;

/**
 * Type that returns the provided {@link Key} type if it is not already present as a key in {@link Services}.
 * @param K The key to conditionally pass through.
 * @param Services The {@link Record} type mapping keys to value types.
 */
export declare type NewKey<
    K extends PropertyKey,
    Services extends Record<PropertyKey, unknown>,
> = K extends keyof Services ? never : K;
