import { DependencyScope } from "./const";
import { ProviderRegistrations } from "./container";
import type { ProviderInfo } from "./provider";

/**
 * Type improving the mouseover preview of the argument type.
 * @param T
 */
export declare type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type KeyTypeInvariants = Record<PropertyKey, unknown>;

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
