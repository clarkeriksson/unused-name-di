import { TRANSIENT } from "../const";
import { Pretty } from "../global";
import {
	ConstructorProvider,
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
	Providers extends ProviderRegistrations<Invariants>
> {
	add<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key]>,
			any
		>,
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: TargetProvider,
		scope: Scope
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
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: TargetProvider,
		scope: Scope
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
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: () => Promise<TargetProvider>,
		scope: Scope
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
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: () => Promise<TargetProvider>,
		scope: Scope
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

	build(): DependencyContainer<Invariants, Pretty<Providers>>;
}

export interface DependencyContainer<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>
> {
	resolve<const K extends keyof Providers>(
		key: K
	): DependencyResolverReturn<Invariants, Providers, K>;
	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>
		) => DependencyContainerBuilder<Invariants, ChildProviders>
	): DependencyContainer<Invariants, Pretty<ChildProviders>>;
	scope(): DependencyContainer<Invariants, Providers>;
}

export class DependencyContainerImpl<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants> = {}
> implements
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
		}
	) {
		this.#impl = impl;
		this.#resolvers = resolvers ?? this.#resolvers;
	}

	resolve<const Key extends keyof Providers>(
		key: Key
	): DependencyResolverReturn<Invariants, Providers, Key> {
		return this.#resolver(key)();
	}

	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>
		) => DependencyContainerBuilder<Invariants, ChildProviders>
	): DependencyContainer<Invariants, Pretty<ChildProviders>> {
		const singletonResolvers: Record<PropertyKey, () => unknown> = {};
		Object.entries(this.#impl).forEach(([k, v]) => {
			if (v!.scope === "singleton") {
				const parentResolver = this.#resolver(k);
				singletonResolvers[k] = () => {
					const result = parentResolver();
					singletonResolvers[k] = () => result;
				};
			}
		});
		const builder = new DependencyContainerImpl(
			{ ...this.#impl },
			singletonResolvers as any
		);
		return configure(
			builder as DependencyContainerBuilder<Invariants, Providers>
		).build();
	}

	scope(): DependencyContainer<Invariants, Providers> {
		return this.child((builder) => builder);
	}

	#createResolver<const Key extends keyof Providers>(
		key: Key
	): () => unknown {
		const impl = this.#impl[key]!;
		const argKeys = impl.provider[INJECTED_KEYS] as PropertyKey[];
		const argResolvers: (() => unknown)[] = argKeys.map(
			(key: PropertyKey) => this.#resolver(key)
		);
		const kind = impl.kind;

		let awaitedIndices = impl.awaitedArgs;
		if (awaitedIndices === null) {
			awaitedIndices = argKeys.reduce((acc, curr, idx) => {
				if (this.#impl[curr]?.awaited) acc.push(idx);
				return acc;
			}, new Array<number>());
			impl.awaitedArgs = awaitedIndices;
		}

		let construct: () => unknown;
		if (awaitedIndices.length === 0) {
			construct =
				kind === ConstructorProvider
					? () => {
							return new impl.provider(
								...argResolvers.map((r) => r())
							);
					  }
					: () => {
							return impl.provider(
								...argResolvers.map((r) => r())
							);
					  };
		} else {
			construct =
				kind === ConstructorProvider
					? async () => {
							const resolving = argResolvers.map((r) => r());
							const resolved = await Promise.all(
								awaitedIndices.map((i) => resolving[i])
							);
							awaitedIndices.forEach(
								(i, j) => (resolving[i] = resolved[j])
							);
							return new impl.provider(...resolving);
					  }
					: async () => {
							const resolving = argResolvers.map((r) => r());
							const resolved = await Promise.all(
								awaitedIndices.map((i) => resolving[i])
							);
							awaitedIndices.forEach(
								(i, j) => (resolving[i] = resolved[j])
							);
							return impl.provider(...resolving);
					  };
		}

		this.#resolvers[key] =
			impl.scope === "transient"
				? construct
				: (function () {
						let instance: any;
						return () => {
							instance ??= construct();
							return instance;
						};
				  })();

		return this.#resolvers[key];
	}

	#resolver<const Key extends keyof Providers>(key: Key): any {
		const cached = this.#resolvers[key];
		if (cached) return cached;

		const impl = this.#impl[key]!;

		if (impl.lazy) {
			return async () => {
				if (!impl.provider) {
					impl.provider = await impl.importProvider();
					impl.kind = impl.provider[PROVIDER_KIND];
				}
				return this.#createResolver(key)();
			};
		} else if (!impl.lazy) {
			return () => {
				return this.#createResolver(key)();
			};
		}
	}

	add<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key]>,
			any
		>,
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: TargetProvider,
		scope: Scope
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
	> {
		this.#impl[key] = {
			awaited: false,
			lazy: false,
			scope,
			kind: provider[PROVIDER_KIND],
			provider,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

	addAsync<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Promise<Invariants[Key]>>,
			any
		>,
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: TargetProvider,
		scope: Scope
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
	> {
		this.#impl[key] = {
			awaited: true,
			lazy: false,
			scope,
			kind: provider[PROVIDER_KIND],
			provider,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

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
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: () => Promise<TargetProvider>,
		scope: Scope
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
	> {
		this.#impl[key] = {
			awaited: false,
			lazy: true,
			scope,
			importProvider: provider,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

	addLazyAsync<
		const Key extends keyof Invariants,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key] | Promise<Invariants[Key]>>,
			any
		>,
		const Scope extends DependencyScope
	>(
		key: Key,
		provider: () => Promise<TargetProvider>,
		scope: Scope
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
	> {
		this.#impl[key] = {
			awaited: true,
			lazy: true,
			scope,
			importProvider: provider,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

	build() {
		return this as any;
	}
}
