import { type KeysOfScope, type Pretty } from "./global";
import { type DependencyScopeKey } from "./const";
import { type KeyTypeInvariants } from "./global";
import {
	type DependencyResolverReturn,
	type EagerAwaitedProviderInfo,
	type EagerSyncProviderInfo,
	type LazyAwaitedProviderInfo,
	type LazySyncProviderInfo,
	type Provider,
	type ProviderInfo,
	type Resolvers,
	type TaggedProvider,
} from "./provider";
import { InjectedKeys, ProviderKind } from "./const";

/**
 * Represents a record type of dependency keys to their respective {@link ProviderInfo} entries for a given
 * {@link Invariants} type.
 */
export type ProviderRegistrations<Invariants extends KeyTypeInvariants> = {
	[Key in keyof Invariants]?: ProviderInfo<
		Invariants,
		Key,
		TaggedProvider,
		DependencyScopeKey
	>;
};

/**
 * Represents an object capable of building a {@link DependencyContainer} for the given {@link Invariants}.
 */
export interface DependencyContainerBuilder<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> {
	/**
	 * Adds an {@link EagerSyncProviderInfo} entry to the final {@link DependencyContainer} {@link Providers}.
	 * @param key The key of an unregistered singleton dependency, or any scoped/transient dependency.
	 * @param provider The {@link TaggedProvider} to register to the associated key.
	 * @param scope The {@link DependencyScopeKey} to assign the registration to.
	 */
	add<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key]>,
			(keyof Providers)[]
		>,
		const Scope extends DependencyScopeKey,
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

	/**
	 * Adds an {@link EagerAwaitedProviderInfo} entry to the final {@link DependencyContainer} {@link Providers}.
	 * @param key The key of an unregistered singleton dependency, or any scoped/transient dependency.
	 * @param provider The {@link TaggedProvider} to register to the associated key.
	 * @param scope The {@link DependencyScopeKey} to assign the registration to.
	 */
	addAwaited<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Promise<Invariants[Key]>>,
			(keyof Providers)[]
		>,
		const Scope extends DependencyScopeKey,
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

	/**
	 * Adds a {@link LazySyncProviderInfo} entry to the final {@link DependencyContainer} {@link Providers}.
	 * @param key The key of an unregistered singleton dependency, or any scoped/transient dependency.
	 * @param provider The {@link TaggedProvider} to register to the associated key.
	 * @param scope The {@link DependencyScopeKey} to assign the registration to.
	 */
	addLazy<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<
				Invariants[Key] extends Promise<infer Service>
					? Service
					: never,
				(keyof Providers)[]
			>,
			any
		>,
		const Scope extends DependencyScopeKey,
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

	/**
	 * Adds a {@link LazyAwaitedProviderInfo} entry to the final {@link DependencyContainer} {@link Providers}.
	 * @param key The key of an unregistered singleton dependency, or any scoped/transient dependency.
	 * @param provider The {@link TaggedProvider} to register to the associated key.
	 * @param scope The {@link DependencyScopeKey} to assign the registration to.
	 */
	addLazyAwaited<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key] | Promise<Invariants[Key]>>,
			(keyof Providers)[]
		>,
		const Scope extends DependencyScopeKey,
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

	/**
	 * Produces a {@link DependencyContainer} from the current {@link DependencyContainerBuilder} state.
	 */
	build(): DependencyContainer<Invariants, Pretty<Providers>>;
}

/**
 * Represents an object capable of resolving services by key based on configuration specified in the producing
 * {@link DependencyContainerBuilder}.
 */
export interface DependencyContainer<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> {
	/**
	 * Resolves the service associated with the given {@link key}.
	 *
	 * If the service and all it's dependencies have registrations that are {@link EagerSyncProviderInfo} then this
	 * will return the service synchronously. Otherwise, a promise will be returned that resolves to the service.
	 *
	 * @param key The service key.
	 */
	resolve<const K extends keyof Providers>(
		key: K,
	): DependencyResolverReturn<Invariants, Providers, K>;

	/**
	 * Creates a child {@link DependencyContainerBuilder} that has a starting configuration identical to this
	 * {@link DependencyContainer}.
	 * @param configure A function taking in a {@link DependencyContainerBuilder} and returning a configured
	 * {@link DependencyContainerBuilder}.
	 */
	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>,
		) => DependencyContainerBuilder<Invariants, ChildProviders>,
	): DependencyContainer<Invariants, Pretty<ChildProviders>>;

	/**
	 * Creates a child {@link DependencyContainer} with an identical configuration to this {@link DependencyContainer}.
	 */
	scope(): DependencyContainer<Invariants, Providers>;
}

/**
 * The implementation of {@link DependencyContainer} and {@link DependencyContainerBuilder}.
 */
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
		return this.#resolver(key)();
	}

	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>,
		) => DependencyContainerBuilder<Invariants, ChildProviders>,
	): DependencyContainer<Invariants, Pretty<ChildProviders>> {
		const inherited = {} as any;
		Object.entries(this.#impl).map(([key, val]) => {
			if (val!.scope === "singleton") {
				inherited[key] = this.#resolver(key as any);
			}
		});
		const builder = new DependencyContainerImpl(
			{ ...this.#impl },
			inherited,
		);
		return configure(
			builder as DependencyContainerBuilder<Invariants, Providers>,
		).build();
	}

	scope(): DependencyContainer<Invariants, Providers> {
		return this.child((builder) => builder);
	}

	/**
	 * Creates the raw resolver function for a given service key.
	 * @param key The service key.
	 * @returns The resolver function.
	 */
	#createResolver<const Key extends keyof Providers>(
		key: Key,
	): () => unknown {
		const impl = this.#impl[key]!;
		const provider = impl.provider;
		const argKeys = provider[InjectedKeys] as PropertyKey[];
		const len = argKeys.length;
		const kind = impl.kind;

		const deps = argKeys.map((k) => this.#resolver(k));

		let awaitedIndices = impl.awaitedArgs;
		if (awaitedIndices === null) {
			awaitedIndices = argKeys.reduce((acc, curr, idx) => {
				if (this.#impl[curr]?.awaited) acc.push(idx);
				return acc;
			}, new Array<number>());
			impl.awaitedArgs = awaitedIndices;
		}
		const awaitedLen = awaitedIndices.length;

		let construct: () => unknown;
		if (len === 0) {
			construct =
				kind === "constructor"
					? () => new provider()
					: () => provider();
		} else if (awaitedIndices.length === 0) {
			construct =
				kind === "constructor"
					? () => {
							const args = new Array(len);
							for (let i = 0; i < len; i++) args[i] = deps[i]();
							return new provider(...args);
						}
					: () => {
							const args = new Array(len);
							for (let i = 0; i < len; i++) args[i] = deps[i]();
							return provider(...args);
						};
		} else {
			construct =
				kind === "constructor"
					? async () => {
							const args = new Array(len);
							for (let i = 0; i < len; i++) args[i] = deps[i]();
							const promises = new Array(awaitedLen);
							for (let i = 0; i < awaitedLen; i++)
								promises[i] = args[i];
							const resolved = await Promise.all(promises);
							for (let i = 0; i < awaitedLen; i++)
								args[awaitedIndices[i]] = resolved[i];
							return new provider(...args);
						}
					: async () => {
							const args = new Array(len);
							for (let i = 0; i < len; i++) args[i] = deps[i]();
							const promises = new Array(awaitedLen);
							for (let i = 0; i < awaitedLen; i++)
								promises[i] = args[i];
							const resolved = await Promise.all(promises);
							for (let i = 0; i < awaitedLen; i++)
								args[awaitedIndices[i]] = resolved[i];
							return provider(...args);
						};
		}
		return impl.scope === "transient"
			? construct
			: (() => {
					let instance: any;
					return () => {
						instance ??= construct();
						return instance;
					};
				})();
	}

	/**
	 * Returns a cached resolver or handles the creation of a new one and caches that for the given service key.
	 * @param key The service key.
	 * @returns The resolver.
	 */
	#resolver<const Key extends keyof Providers>(key: Key): any {
		const cached = this.#resolvers[key];
		if (cached !== undefined) return cached as () => unknown;

		const impl = this.#impl[key]! as any;
		let resolver: () => unknown;

		if (!impl.lazy) {
			resolver = this.#createResolver(key); // recurses into #resolver for deps
		} else {
			let real: (() => unknown) | undefined;
			const ready = () => (real ??= this.#createResolver(key));

			resolver = () =>
				impl.provider !== undefined
					? Promise.resolve(ready()())
					: (impl.loading ??= impl.importProvider().then(
							(p: any) => {
								impl.provider = p;
								impl.kind = p[ProviderKind];
							},
							(e: unknown) => {
								impl.loading = undefined; // don't cache a rejection
								throw e;
							},
						)).then(() => ready()());
		}
		return ((this.#resolvers as any)[key] = resolver);
	}

	add<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key]>,
			any
		>,
		const Scope extends DependencyScopeKey,
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
	> {
		this.#impl[key] = {
			provider,
			importProvider: undefined,
			loading: undefined,
			kind: provider[ProviderKind],
			scope,
			awaited: false,
			lazy: false,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

	addAwaited<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Promise<Invariants[Key]>>,
			any
		>,
		const Scope extends DependencyScopeKey,
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
	> {
		this.#impl[key] = {
			provider,
			importProvider: undefined,
			loading: undefined,
			kind: provider[ProviderKind],
			scope,
			awaited: true,
			lazy: false,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

	addLazy<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
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
		const Scope extends DependencyScopeKey,
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
	> {
		this.#impl[key] = {
			provider: undefined,
			importProvider: provider,
			loading: undefined,
			kind: undefined,
			scope,
			awaited: false,
			lazy: true,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

	addLazyAwaited<
		const Key extends KeysOfScope<
			Invariants,
			Providers,
			"scoped" | "transient"
		>,
		const TargetProvider extends TaggedProvider<
			Invariants,
			Provider<Invariants[Key] | Promise<Invariants[Key]>>,
			any
		>,
		const Scope extends DependencyScopeKey,
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
	> {
		this.#impl[key] = {
			provider: undefined,
			importProvider: provider,
			loading: undefined,
			kind: undefined,
			scope,
			awaited: true,
			lazy: true,
			awaitedArgs: null,
		} as any;
		return this as any;
	}

	build() {
		return this as any;
	}
}
