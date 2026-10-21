import { Injected } from "./const";
import { ProviderScopeKey } from "./const";
import { KeyTupleForTypeTuple, KeyTypeInvariants } from "./context";
import { Provider, ProviderInfo, TaggedProvider } from "./provider";

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
		readonly any[],
		Invariants,
		readonly any[],
		ProviderScopeKey,
		boolean,
		boolean
	>;
};

export interface DependencyContainerBuilder<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> {
	ctor<
		const Key extends keyof Invariants,
		const Arguments extends readonly Invariants[keyof Invariants][],
		const InjectedKeys extends {
			[K in keyof Arguments]: {
				[P in keyof Invariants]: Arguments[K] extends Invariants[P]
					? P
					: never;
			}[keyof Invariants];
		},
		const Scope extends ProviderScopeKey,
		const Async extends boolean,
		const Lazy extends boolean = false,
	>(
		key: Key,
		provider: Lazy extends true
			? () => Promise<
					TaggedProvider<
						Invariants,
						Invariants[Key],
						Arguments,
						InjectedKeys,
						Async
					>
				>
			: TaggedProvider<
					Invariants,
					Invariants[Key],
					Arguments,
					InjectedKeys,
					Async
				>,
		scope: Scope,
		options?: { lazy: Lazy },
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: ProviderInfo<
				Invariants[Key],
				Arguments,
				Invariants,
				InjectedKeys,
				Scope,
				Async,
				Lazy
			>;
		}
	>;
}

export interface DependencyContainer<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> {
	resolve<const K extends keyof Providers>(key: K): any;
	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>,
		) => DependencyContainerBuilder<Invariants, ChildProviders>,
	): DependencyContainer<Invariants, ChildProviders>;
	scope(): DependencyContainer<Invariants, Providers>;
}
