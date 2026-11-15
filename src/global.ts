import { DependencyScope } from "./const";
import { ProviderRegistrations } from "./container";
import type { ProviderInfo } from "./provider";

/**
 * Type improving the mouseover preview of the argument type.
 * @param T
 */
export declare type Pretty<T> = { [K in keyof T]: T[K] } & {};

/**
 * Represents the immutable service key to service type relationships that must hold for all dependency containers
 * that reference it.
 */
export type KeyTypeInvariants = Record<PropertyKey, unknown>;

/**
 * Returns a union type of all keys that have no registration or are registered as one of the specified scopes.
 */
export type KeysOfScope<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
	Scopes extends DependencyScope,
> = {
	[K in keyof Invariants]: Providers[K] extends ProviderInfo<
		any,
		any,
		any,
		Exclude<DependencyScope, Scopes>
	>
		? never
		: K;
}[keyof Invariants];
