import {
	CTOR,
	FACTORY,
	SCOPE_MAP,
	type ScopeKey,
	type ScopeTokenFromKey,
	SINGLETON,
	TRANSIENT,
	ProviderKindToken,
} from "./const";
import {
	type CtorWithArgKeys,
	type ServiceContext,
	type FactoryWithArgKeys,
	type ProviderWithArgKeys,
} from "./context";
import {
	type KeyIfExtensible,
	type KeysForValueTuple,
	type MapToProperty,
	type Pretty,
	type InstanceRecord,
	type BroadenPrimitiveConst,
	ProviderTag,
	INJECTED,
	PROVIDER,
	AnyTrue,
} from "./global";
import { type Constructor, type Factory } from "./types/provider";

export interface ServiceInfo<
	Provider extends ProviderWithArgKeys = ProviderWithArgKeys,
	Scope extends ScopeKey = ScopeKey,
	Lazy extends boolean = false,
	Async extends boolean = false,
> {
	readonly provider: Lazy extends true ? () => Promise<Provider> : Provider;
	readonly scope: ScopeTokenFromKey<Scope>;
	readonly kind: ProviderKindToken;
}

export interface ServiceContainerBuilder<
	ContextServices extends InstanceRecord,
	Services extends Record<PropertyKey, ServiceInfo> = {},
> {
	ctor<
		const K extends keyof ContextServices,
		const P extends CtorWithArgKeys<
			Constructor<ContextServices[K], unknown[]>,
			MapToProperty<Services, "provider">,
			KeysForValueTuple<Services, any>
		>,
		const U extends ScopeKey,
	>(
		key: KeyIfExtensible<Services, K>,
		provider: P,
		scope: U,
	): ServiceContainerBuilder<
		ContextServices,
		Omit<Services, K> & {
			[Key in K]: ServiceInfo<P, U>;
		}
	>;

	factory<
		const K extends keyof ContextServices,
		const P extends FactoryWithArgKeys<
			Factory<ContextServices[K], unknown[]>,
			MapToProperty<Services, "provider">,
			KeysForValueTuple<Services, any>
		>,
		const U extends ScopeKey,
	>(
		key: KeyIfExtensible<Services, K>,
		provider: P,
		scope: U,
	): ServiceContainerBuilder<
		ContextServices,
		Omit<Services, K> & {
			[Key in K]: ServiceInfo<P, U>;
		}
	>;

	instance<
		const K extends keyof ContextServices,
		const I extends ContextServices[K],
		const U extends Exclude<ScopeKey, "transient">,
	>(
		key: KeyIfExtensible<Services, K>,
		instance: I,
		scope: U,
	): ServiceContainerBuilder<
		ContextServices,
		Omit<Services, K> & {
			[Key in K]: ServiceInfo<
				Factory<BroadenPrimitiveConst<I>, []> & ProviderTag<[]>,
				U
			>;
		}
	>;

	build(): ServiceContainer<ContextServices, Pretty<Services>>;
}

export interface ServiceContainer<
	ContextServices extends InstanceRecord,
	Services extends Record<PropertyKey, ServiceInfo>,
> {
	resolve<const K extends keyof ContextServices>(key: K): ContextServices[K];
	child<I extends Record<PropertyKey, ServiceInfo>>(
		configure: (
			builder: ServiceContainerBuilder<ContextServices, Services>,
		) => ServiceContainerBuilder<ContextServices, I>,
	): ServiceContainer<ContextServices, I>;
	scope(): ServiceContainer<ContextServices, Services>;
}

export class ServiceContainerImpl<
	ContextServices extends InstanceRecord,
	Services extends Record<PropertyKey, ServiceInfo>,
>
	implements
		ServiceContainer<ContextServices, Services>,
		ServiceContainerBuilder<ContextServices, Services>
{
	readonly #arrayPool: any[][] = [];
	readonly #ctx: ServiceContext<ContextServices>;
	readonly #impl: Record<PropertyKey, ServiceInfo>;
	readonly #resolvers: Record<PropertyKey, () => unknown>;

	constructor(
		context: ServiceContext<ContextServices>,
		impl: Services,
		resolvers?: Record<PropertyKey, () => unknown>,
	) {
		this.#ctx = context;
		this.#impl = impl;
		this.#resolvers = resolvers ?? {};
	}

	resolve<const K extends keyof ContextServices>(key: K): ContextServices[K] {
		return this.resolver(key)();
	}

	child<I extends Record<PropertyKey, ServiceInfo>>(
		configure: (
			builder: ServiceContainerBuilder<ContextServices, Services>,
		) => ServiceContainerBuilder<ContextServices, I>,
	): ServiceContainer<ContextServices, I> {
		const singletonResolvers: Record<PropertyKey, () => unknown> = {};
		Object.entries(this.#impl).forEach(([k, v]) => {
			if (v.scope === SINGLETON) singletonResolvers[k] = this.resolver(k);
		});
		const builder = new ServiceContainerImpl(
			this.#ctx,
			{ ...this.#impl },
			singletonResolvers,
		);
		return configure(builder).build();
	}

	scope(): ServiceContainer<ContextServices, Services> {
		return this.child((builder) => builder);
	}

	private resolver<const K extends keyof Services>(
		key: K,
	): () => ContextServices[K] {
		const cached = this.#resolvers[key];
		if (cached) return cached as any;

		const impl = this.#impl[key];
		const deps: PropertyKey[] = this.#ctx.readDeps(impl.provider);

		const argResolvers = deps.map((k) =>
			this.resolver(k as keyof ContextServices),
		);

		const isFactory = impl.kind === FACTORY;
		const provider = impl.provider as any;

		const construct: () => ContextServices[K] = isFactory
			? () => provider(...argResolvers.map((a) => a()))
			: () => new provider(...argResolvers.map((a) => a()));

		const resolver =
			impl.scope === TRANSIENT
				? construct
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

	ctor<
		const K extends keyof ContextServices,
		const P extends CtorWithArgKeys<
			Constructor<ContextServices[K]>,
			MapToProperty<Services, "provider">,
			KeysForValueTuple<Services, any>
		>,
		const U extends ScopeKey,
	>(
		key: KeyIfExtensible<Services, K>,
		provider: P,
		scope: U,
	): ServiceContainerBuilder<
		ContextServices,
		Omit<Services, K> & {
			[Key in K]: ServiceInfo<P, U>;
		}
	> {
		this.#impl[key] = {
			provider,
			scope: SCOPE_MAP[scope],
			kind: CTOR,
		};
		return this as ServiceContainerBuilder<
			ContextServices,
			Omit<Services, K> & {
				[Key in K]: ServiceInfo<P, U>;
			}
		>;
	}

	factory<
		const K extends keyof ContextServices,
		const P extends FactoryWithArgKeys<
			Factory<ContextServices[K]>,
			MapToProperty<Services, "provider">,
			KeysForValueTuple<Services, any>
		>,
		const U extends ScopeKey,
	>(
		key: KeyIfExtensible<Services, K>,
		provider: P,
		scope: U,
	): ServiceContainerBuilder<
		ContextServices,
		Omit<Services, K> & {
			[Key in K]: ServiceInfo<P, U>;
		}
	> {
		this.#impl[key] = {
			provider,
			scope: SCOPE_MAP[scope],
			kind: FACTORY,
		};
		return this as ServiceContainerBuilder<
			ContextServices,
			Omit<Services, K> & {
				[Key in K]: ServiceInfo<P, U>;
			}
		>;
	}

	instance<
		const K extends keyof ContextServices,
		const I extends ContextServices[K],
		const U extends ScopeKey,
	>(
		key: KeyIfExtensible<Services, K>,
		instance: I,
		scope: U,
	): ServiceContainerBuilder<
		ContextServices,
		Omit<Services, K> & {
			[Key in K]: ServiceInfo<
				(() => I) & { [INJECTED]: []; [PROVIDER]: true },
				U
			>;
		}
	> {
		this.#impl[key] = {
			provider: (() => instance) as any,
			scope: SCOPE_MAP[scope],
			kind: FACTORY,
		};
		this.#ctx.inject(this.#impl[key].provider, []);
		return this as ServiceContainerBuilder<
			ContextServices,
			Omit<Services, K> & {
				[Key in K]: ServiceInfo<
					(() => I) & { [INJECTED]: []; [PROVIDER]: true },
					U
				>;
			}
		>;
	}

	build(): ServiceContainer<ContextServices, Pretty<Services>> {
		return new ServiceContainerImpl(
			this.#ctx,
			this.#impl as Services,
			this.#resolvers,
		);
	}
}
