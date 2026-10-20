import { type ScopeKey } from "./const";
import { type ServiceInfo } from "./container";
import type { Provider, ProviderReturn } from "./types/provider";

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
 * Type that transforms a {@link Record} type with {@link Provider} values into a {@link Record} type with {@link ProviderReturn} values.
 * @param T The {@link Record} type with {@link Provider} values to convert.
 */
export declare type CreatorMapToInstanceMap<
	T extends Record<PropertyKey, Provider>
> = {
	[K in keyof T]: ProviderReturn<T[K]>;
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
	[Key in keyof Services]: Services[Key] extends ServiceInfo<any, Scope>
		? Key
		: never;
}[keyof Services];

/**
 * Type that returns the provided {@link Key} type if it is not already associated with a {@link ServiceInfo} with {@link ServiceInfo["scope"] scope} value of singleton.
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

export declare const INJECTED: unique symbol;
export declare const PROVIDER: unique symbol;

/**
 * Metadata object joined with service providers to carry arg information.
 * @param Args The argument
 */
export type ProviderTag<Args extends readonly any[] = any[]> = {
	readonly [INJECTED]: Args;
	readonly [PROVIDER]: true;
};

export type AnyTrue<C extends readonly boolean[]> = true extends C[number]
	? true
	: false;
