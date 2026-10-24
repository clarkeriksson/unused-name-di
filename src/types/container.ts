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
	DependencyResolverReturn,
	EagerTaggedProviderToInfo,
	LazyTaggedProviderToInfo,
	Provider,
	ProviderInfo,
	RequiresAsyncResolver,
	TaggedConstructor,
	TaggedFactory,
	ProviderRegistration,
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
		ProviderRegistration<any, any, any, any>,
		DependencyScope
	>;
};

export interface DependencyContainerBuilder<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> {
	ctor<
		const Key extends keyof Invariants,
		const TargetConstructor extends TaggedConstructor<
			Invariants,
			Invariants[Key],
			any,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: TargetConstructor,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: EagerTaggedProviderToInfo<TargetConstructor, Scope>;
		}
	>;
	lazyCtor<
		const Key extends keyof Invariants,
		const TargetConstructor extends TaggedConstructor<
			Invariants,
			Invariants[Key],
			any,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: () => Promise<TargetConstructor>,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: LazyTaggedProviderToInfo<TargetConstructor, Scope>;
		}
	>;
	factory<
		const Key extends keyof Invariants,
		const TargetFactory extends TaggedFactory<
			Invariants,
			Invariants[Key],
			any,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: TargetFactory,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: EagerTaggedProviderToInfo<TargetFactory, Scope>;
		}
	>;
	lazyFactory<
		const Key extends keyof Invariants,
		const TargetFactory extends TaggedFactory<
			Invariants,
			Invariants[Key],
			any,
			any
		>,
		const Scope extends DependencyScope,
	>(
		key: Key,
		provider: () => Promise<TargetFactory>,
		scope: Scope,
	): DependencyContainerBuilder<
		Invariants,
		Providers & {
			[K in Key]: LazyTaggedProviderToInfo<TargetFactory, Scope>;
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
		DependencyContainerBuilder<Invariants, Providers>,
		DependencyContainer<Invariants, Providers>
{
	readonly #impl: Record<keyof Providers, ProviderInfo> = {} as Record<
		keyof Providers,
		ProviderInfo
	>;
	readonly #resolvers: Record<keyof Providers, () => any> = {} as Record<
		keyof Providers,
		() => any
	>;

	public resolve<const K extends keyof Providers>(
		key: K,
	): DependencyResolverReturn<Invariants, Providers, K> {
		const cached = this.#resolvers[key];
		if (cached)
			return cached() as DependencyResolverReturn<
				Invariants,
				Providers,
				K
			>;

		const resolver = this.#resolver(key);
		if ("then" in resolver) {
			return resolver.then((value) =>
				value(),
			) as DependencyResolverReturn<Invariants, Providers, K>;
		} else {
			return resolver();
		}
	}

	#resolverFromParts<const Key extends keyof Providers>(
		key: Key,
		info: Providers[Key],
		rawDependencyResolvers: (() => any)[],
	) {
		if (!info) return;

		const construct: () => any =
			info.provider[PROVIDER_KIND] === FactoryProvider
				? () =>
						(info.provider as TaggedFactory)(
							...rawDependencyResolvers.map((r) => r()),
						)
				: () =>
						new (info.provider as TaggedConstructor)(
							...rawDependencyResolvers.map((r) => r()),
						);

		const resolver =
			info.scope === "transient"
				? construct()
				: (() => {
						let instance: any;
						return () => {
							instance ??= construct();
							return instance;
						};
					})();

		this.#resolvers[key] = resolver;
		return resolver;
	}

	#resolver<const Key extends keyof Providers>(
		key: Key,
	):
		| Promise<() => DependencyResolverReturn<Invariants, Providers, Key>>
		| (() => DependencyResolverReturn<Invariants, Providers, Key>) {
		const cached = this.#resolvers[key];
		if (cached) return cached as any;

		const info: ProviderInfo = this.#impl[key];
		if (info.lazy === true) {
			info.provider().then((result) => {
				const deps: readonly (keyof Providers)[] =
					result[INJECTED_KEYS];
			});
		}

		/**
		 * CASES:
		 * 1)
		 */

		// const info: ProviderInfo = this.#impl[key];
		// if ("importProvider" in info) {
		// 	return info
		// 		.importProvider()
		// 		.then((provider) => {
		// 			info.provider = provider;
		// 			const deps = provider[INJECTED_KEYS].map(
		// 				(key: PropertyKey) => this.#resolver(key),
		// 			);
		// 			return Promise.all(deps);
		// 		})
		// 		.then((resolvers) => {
		// 			return this.#resolverFromParts(key, info, resolvers);
		// 		});
		// } else {
		// 	const resolvers = info.provider[INJECTED_KEYS].map(
		// 		(key: PropertyKey) => this.#resolver(key),
		// 	);
		// 	if (resolvers.some((r: any) => r instanceof Promise)) {
		// 		return Promise.all(resolvers).then((resolvers) => {
		// 			return this.#resolverFromParts(key, info, resolvers);
		// 		});
		// 	} else {
		// 		return this.#resolverFromParts(key, info, resolvers);
		// 	}
		// }
	}
}
