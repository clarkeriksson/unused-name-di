import { KeysOfScope, Pretty } from "./global";
import { INJECTED_KEYS, PROVIDER_KIND } from "./const";
import { DependencyScope } from "./const";
import { KeyTypeInvariants } from "./global";
import {
	DependencyResolverReturn,
	EagerAwaitedProviderInfo,
	EagerSyncProviderInfo,
	LazyAwaitedProviderInfo,
	LazySyncProviderInfo,
	Provider,
	ProviderInfo,
	Resolvers,
	TaggedConstructor,
	TaggedProvider,
} from "./provider";

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

	build(): DependencyContainer<Invariants, Pretty<Providers>>;
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
		return this.#resolver(key)();
	}

	child<ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, Providers>,
		) => DependencyContainerBuilder<Invariants, ChildProviders>,
	): DependencyContainer<Invariants, Pretty<ChildProviders>> {
		const singletonResolvers = {} as any;
		Object.entries(this.#impl).map(([key, val]) => {
			if (val!.scope === "singleton") {
				const getParentResolver = this.#resolver.bind(this);
				singletonResolvers[key] = () => {
					const parentResolver = getParentResolver(key);
					const resolved = parentResolver();
					if (resolved instanceof Promise) {
						return resolved.then((r) => {
							singletonResolvers[key] = () => r;
							return r;
						});
					} else {
						singletonResolvers[key] = () => resolved;
						return resolved;
					}
				};
			}
		});
		const builder = new DependencyContainerImpl(
			{ ...this.#impl },
			singletonResolvers,
		);
		return configure(
			builder as DependencyContainerBuilder<Invariants, Providers>,
		).build();
	}

	scope(): DependencyContainer<Invariants, Providers> {
		return this.child((builder) => builder);
	}

	#createResolver<const Key extends keyof Providers>(
		key: Key,
	): () => unknown {
		const impl = this.#impl[key]!;
		const argKeys = impl.provider[INJECTED_KEYS] as PropertyKey[];
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
			if (kind === "constructor") {
				construct = () =>
					new impl.provider(...argKeys.map((r) => this.resolve(r)));
			} else {
				construct = () =>
					impl.provider(...argKeys.map((r) => this.resolve(r)));
			}
		} else {
			construct =
				kind === "constructor"
					? async () => {
							const resolving = argKeys.map((r) =>
								this.resolve(r),
							);
							const resolved = await Promise.all(
								awaitedIndices.map((i) => resolving[i]),
							);
							awaitedIndices.forEach(
								(i, j) => (resolving[i] = resolved[j]),
							);
							return new impl.provider(...resolving);
						}
					: async () => {
							const resolving = argKeys.map((r) =>
								this.resolve(r),
							);
							const resolved = await Promise.all(
								awaitedIndices.map((i) => resolving[i]),
							);
							awaitedIndices.forEach(
								(i, j) => (resolving[i] = resolved[j]),
							);
							return impl.provider(...resolving);
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

	#resolver<const Key extends keyof Providers>(key: Key): any {
		const cached = this.#resolvers[key];
		if (cached !== undefined) return cached;

		const impl = this.#impl[key]!;

		if (impl.lazy) {
			return async () => {
				if (!impl.provider) {
					impl.provider = await impl.importProvider();
					impl.kind = impl.provider[PROVIDER_KIND];
				}
				const resolver = this.#createResolver(key);
				this.#resolvers[key] = resolver as any;
				return resolver();
			};
		} else if (!impl.lazy) {
			return () => {
				const resolver = this.#createResolver(key);
				this.#resolvers[key] = resolver as any;
				return resolver();
			};
		}
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
