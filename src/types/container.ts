import { Pretty } from "../global";
import {
	FactoryProvider,
	INJECTED_KEYS,
	PROVIDER_KIND,
	ReturnKind,
} from "./const";
import { DependencyScope } from "./const";
import { KeyTypeInvariants } from "./context";
import {
	Constructor,
	DependencyResolverReturn,
	EagerAwaitedProviderInfo,
	EagerSyncProviderInfo,
	Factory,
	LazyAwaitedProviderInfo,
	LazySyncProviderInfo,
	Provider,
	ProviderInfo,
	RequiresAsyncResolver,
	Resolvers,
	TaggedConstructor,
	TaggedProvider,
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
		Invariants,
		Key,
		TaggedConstructor,
		DependencyScope
	>;
};

export interface DependencyContainerBuilder<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> {
	add<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key]>,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: TargetProvider,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: EagerSyncProviderInfo<
				Invariants,
				Key,
				TargetProvider,
				Scope
			>;
		}
	>;
	addAsync<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Promise<Invariants[Key]>>,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: TargetProvider,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: EagerAwaitedProviderInfo<
				Invariants,
				Key,
				TargetProvider,
				Scope
			>;
		}
	>;
	addLazy<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<
				Invariants[Key] extends Promise<infer Service>
					? Service
					: never,
				readonly any[]
			>,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: () => Promise<TargetProvider>,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: LazySyncProviderInfo<
				Invariants,
				Key,
				TargetProvider,
				Scope
			>;
		}
	>;
	addLazyAsync<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key] | Promise<Invariants[Key]>>,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: () => Promise<TargetProvider>,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: LazyAwaitedProviderInfo<
				Invariants,
				Key,
				TargetProvider,
				Scope
			>;
		}
	>;
}

export interface DependencyContainer<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> {
	resolve<const K extends keyof Providers>(
		key: K,
	): DependencyResolverReturn<Invariants, Providers, K>;
	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>,
		) => DependencyContainerBuilder<Invariants, ChildProviders>,
	): DependencyContainer<Invariants, Pretty<ChildProviders>>;
	scope(): DependencyContainer<Invariants, Providers>;
}

export class DependencyContainerImpl<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants> = {},
>
	implements
		DependencyContainer<Invariants, Providers>,
		DependencyContainerBuilder<Invariants, Providers>
{
	readonly #impl: Providers = {} as Providers;
	readonly #resolvers: Partial<Resolvers<Invariants, Providers>> = {};

	constructor(
		impl: Providers,
		resolvers?: {
			[K in keyof Invariants]: () => DependencyResolverReturn<
				Invariants,
				Providers,
				K
			>;
		},
	) {
		this.#impl = impl;
		this.#resolvers = resolvers ?? this.#resolvers;
	}

	resolve<const Key extends keyof Providers>(
		key: Key,
	): DependencyResolverReturn<Invariants, Providers, Key> {
		return null as any;
	}

	#resolver<const Key extends keyof Providers>(key: Key): any {
		const cached = this.#resolvers[key];
		if (cached) return cached;

		/**
		 * Will be awaited:
		 * - If awaited directly
		 * - If using an awaited dependency descendant
		 */
	}
}
