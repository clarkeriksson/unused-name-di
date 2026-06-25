import {
    INJECTED,
    PROVIDER,
    type ProviderKindKey,
    type ScopeKey,
} from "./const";
import { type ServiceInfo } from "./container";

/**
 * Type improving the mouseover preview of the argument type.
 * @param T
 */
export declare type Pretty<T> = { [K in keyof T]: T[K] } & {};

/** Semantic type representing a service instance type. */
export declare type Instance = unknown;

/** Semantic type representing a record from service keys to their assigned instance types. */
export declare type InstanceRecord = Record<PropertyKey, Instance>;

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
export declare type Ctor<
	T = unknown,
	Args extends readonly any[] = readonly any[]
> = new (...args: Args) => T;

/**
 * Type representing the factory of instance type {@link T} that takes inputs of type {@link Args}.
 * @param T The instance type.
 * @param Args The argument tuple type.
 */
export declare type Factory<
	T = unknown,
	Args extends readonly any[] = readonly any[]
> = (...args: Args) => T;

/**
 * Type extracting the arguments from {@link Ctor} type {@link T}.
 * @param T
 */
export declare type CtorArgs<T> = T extends Ctor<any, infer Args>
	? Args
	: never;

/**
 * Type extracting the arguments from {@link Factory} type {@link T}.
 * @param T
 */
export declare type FactoryArgs<T> = T extends Factory<any, infer Args>
	? Args
	: never;

/**
 * Type extracting the return type from {@link Ctor} type {@link T}.
 * @param T
 */
export declare type CtorReturn<T> = T extends Ctor<infer Return, any>
	? Return
	: never;

/**
 * Type extracting the return type from {@link Factory} type {@link T}.
 * @param T
 */
export declare type FactoryReturn<T> = T extends Factory<infer Return, any>
	? Return
	: never;

/**
 * Type representing the constructor or factory of instance type {@link T} that takes inputs of type {@link Args}.
 * @param T The instance type.
 * @param Args The argument tuple type.
 */
export declare type Creator<T = unknown, Args extends readonly any[] = any[]> =
	| Ctor<T, Args>
	| Factory<T, Args>;

/**
 * Type extracting the arguments from {@link Ctor} or {@link Factory} type {@link T}.
 * @param T
 */
export declare type CreatorArgs<T> = T extends Ctor
	? CtorArgs<T>
	: T extends Factory
	? FactoryArgs<T>
	: never;

/**
 * Type extracting the return type from {@link Ctor} or {@link Factory} type {@link T}.
 * @param T
 */
export declare type CreatorReturn<T> = T extends Ctor
	? CtorReturn<T>
	: T extends Factory
	? FactoryReturn<T>
	: never;

/**
 * Type that transforms a {@link Record} type with {@link Creator} values into a {@link Record} type with {@link CreatorReturn} values.
 * @param T The {@link Record} type with {@link Creator} values to convert.
 */
export declare type CreatorMapToInstanceMap<
	T extends Record<PropertyKey, Creator>
> = {
	[K in keyof T]: CreatorReturn<T[K]>;
};

/**
 * Type that returns a tuple type of keys that correspond to values assignable to types {@link V} based on the {@link Record} type {@link T}.
 * @param T The {@link Record} type mapping keys to value types.
 * @param V The value tuple to retrieve keys for.
 */
export declare type KeysForValueTuple<
	T extends Record<PropertyKey, unknown>,
	V extends readonly any[]
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
 * Type that finds all {@link ServiceInfo} keys associated with a {@link ServiceInfo} the has a {@link ServiceInfo.scope scope} assignable to the given {@link Scope} type parameter in the {@link Services} {@link Record} type.
 * @param Services The {@link Record} type with {@link ServiceInfo} values.
 * @param Scope The {@link ScopeKey} to filter by.
 */
export declare type KeysForScope<
	Services extends Record<PropertyKey, ServiceInfo>,
	Scope extends ScopeKey
> = {
	[Key in keyof Services]: Services[Key] extends ServiceInfo<
		any,
		ProviderKindKey,
		Scope
	>
		? Key
		: never;
}[keyof Services];

/**
 * Type that returns the provided {@link Key} type if it is not already associated with a {@link ServiceInfo} with {@link ServiceInfo.scope scope} value of singleton.
 * @param Services The {@link Record} type with {@link ServiceInfo} values.
 * @param Key The key to conditionally pass through.
 */
export declare type KeyIfExtensible<
	Services extends Record<PropertyKey, ServiceInfo>,
	Key extends PropertyKey
> = Key extends KeysForScope<Services, "singleton"> ? never : Key;

/**
 * Type that returns the provided {@link Key} type if it is not already present as a key in {@link Services}.
 * @param K The key to conditionally pass through.
 * @param Services The {@link Record} type mapping keys to value types.
 */
export declare type NewKey<
	K extends PropertyKey,
	Services extends Record<PropertyKey, unknown>
> = K extends keyof Services ? never : K;

/**
 * Metadata object joined with service providers to carry arg information.
 * @param Args The argument
 */
export type ProviderTag<Args extends readonly any[] = any[]> = {
	readonly [INJECTED]: Args;
	readonly [PROVIDER]: true;
};
