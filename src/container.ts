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

	#stable(key: PropertyKey): () => unknown {
		const cached = (this.#resolvers as any)[key];
		if (cached !== undefined) return cached;
		let inner: (() => unknown) | undefined;
		const stub = () => (inner ??= this.#createResolver(key as any))();
		(this.#resolvers as any)[key] = stub;
		return stub;
	}

	#createResolver<const Key extends keyof Providers>(
		key: Key,
	): () => unknown {
		const impl = this.#impl[key]!;
		const provider = impl.provider;
		const argKeys = provider[INJECTED_KEYS] as PropertyKey[];
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
		if (awaitedIndices.length === 0) {
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
		// const impl = this.#impl[key]!;
		// const argKeys = impl.provider[INJECTED_KEYS] as PropertyKey[];
		// const kind = impl.kind;

		// let awaitedIndices = impl.awaitedArgs;
		// if (awaitedIndices === null) {
		// 	awaitedIndices = argKeys.reduce((acc, curr, idx) => {
		// 		if (this.#impl[curr]?.awaited) acc.push(idx);
		// 		return acc;
		// 	}, new Array<number>());
		// 	impl.awaitedArgs = awaitedIndices;
		// }

		// let construct: () => unknown;
		// if (awaitedIndices.length === 0) {
		// 	const len = argKeys.length;
		// 	const deps = argKeys.map((k) => this.#stable(k));
		// 	if (kind === "constructor") {
		// 		construct = () => {
		// 			const args = new Array(len);
		// 			for (let i = 0; i < len; i++) {
		// 				args[i] = deps[i]();
		// 			}
		// 			return new impl.provider(...args);
		// 		};
		// 	} else {
		// 		construct = () =>
		// 			impl.provider(...argKeys.map((r) => this.resolve(r)));
		// 	}
		// } else {
		// 	construct =
		// 		kind === "constructor"
		// 			? async () => {
		// 					const resolving = argKeys.map((r) =>
		// 						this.resolve(r),
		// 					);
		// 					const resolved = await Promise.all(
		// 						awaitedIndices.map((i) => resolving[i]),
		// 					);
		// 					awaitedIndices.forEach(
		// 						(i, j) => (resolving[i] = resolved[j]),
		// 					);
		// 					return new impl.provider(...resolving);
		// 				}
		// 			: async () => {
		// 					const resolving = argKeys.map((r) =>
		// 						this.resolve(r),
		// 					);
		// 					const resolved = await Promise.all(
		// 						awaitedIndices.map((i) => resolving[i]),
		// 					);
		// 					awaitedIndices.forEach(
		// 						(i, j) => (resolving[i] = resolved[j]),
		// 					);
		// 					return impl.provider(...resolving);
		// 				};
		// }

		// return impl.scope === "transient"
		// 	? construct
		// 	: (() => {
		// 			let instance: any;
		// 			return () => {
		// 				instance ??= construct();
		// 				return instance;
		// 			};
		// 		})();
	}

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
								impl.kind = p[PROVIDER_KIND];
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
			provider,
			importProvider: undefined,
			loading: undefined,
			kind: provider[PROVIDER_KIND],
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
			provider,
			importProvider: undefined,
			loading: undefined,
			kind: provider[PROVIDER_KIND],
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
