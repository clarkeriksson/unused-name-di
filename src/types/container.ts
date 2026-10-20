import { INJECTED } from "./const";
import { ProviderScope } from "./const";
import { KeyTupleForTypeTuple, KeyTypeInvariants } from "./context";
import {
	ArgKeysFromTaggedProvider,
	Provider,
	ProviderInfo,
	ProviderTag,
	ProviderWithArgKeys,
} from "./provider";

/**
 * CASES
 * For some key type K with associated invariant T = Invariants[K]
 *
 * 1.
 * Registration Options: Eager, Synchronous
 * Provider Argument: Provider<T>
 *
 * 2.
 * Registration Options: Lazy, Synchronous
 * Provider Argument: () => Promise<Provider<T>>
 *
 * 3.
 * Registration Options: Eager, Asynchronous
 * Provider Argument: Provider<Promise<T>>
 *
 * 4.
 * Registration Options: Lazy, Asynchronous
 * Provider Argument: () => Promise<Provider<Promise<T>>>
 */

export type ProviderRegistrations<Invariants extends KeyTypeInvariants> = {
	[Key in keyof Invariants]?: ProviderInfo<
		Invariants[Key],
		Invariants,
		any,
		ProviderScope,
		any,
		any
	>;
};

export interface DependencyContainerBuilder<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>
> {
	ctor<
		const Key extends keyof Invariants,
		const TargetProvider extends ProviderWithArgKeys<
			Provider<Invariants[Key], ArgKeys>,
			Invariants,
			ArgKeys
		>,
		const ArgKeys extends (keyof Invariants)[] &
			KeyTupleForTypeTuple<any, Providers>,
		const Scope extends ProviderScope,
		const LazyImport extends boolean = false,
		const ReturnsPromise extends boolean = false
	>(
		key: Key,
		provider: TargetProvider,
		scope: Scope,
		options?: { lazyImport?: LazyImport; returnsPromise?: ReturnsPromise }
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: ProviderInfo<
				TargetProvider,
				Invariants,
				TargetProvider[typeof INJECTED],
				Scope,
				LazyImport,
				ReturnsPromise
			>;
		}
	>;
}

export interface DependencyContainer<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>
> {
	resolve<const K extends keyof Providers>(
		key: K
	): {
		[K in keyof (Providers[K] extends ProviderInfo<
			Invariants[K],
			Invariants,
			infer ProviderKeys,
			any,
			any,
			any
		>
			? ProviderKeys
			: never)]: Providers[K] extends
			| ProviderInfo<any, any, any, any, true, any>
			| ProviderInfo<any, any, any, any, any, true>
			? true
			: false;
	} extends false[]
		? Invariants[K]
		: Promise<Invariants[K]>;
	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>
		) => DependencyContainerBuilder<Invariants, ChildProviders>
	): DependencyContainer<Invariants, ChildProviders>;
	scope(): DependencyContainer<Invariants, Providers>;
}
