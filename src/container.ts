import {
	INJECTED,
	CTOR,
	FACTORY,
	SCOPE_MAP,
	type ScopeKey,
	type ScopeTokenFromKey,
	SINGLETON,
	TRANSIENT,
	PROVIDER,
	ProviderKindToken,
} from "./const";
import {
	type CtorWithArgKeys,
	type ServiceContext,
	type FactoryWithArgKeys,
	type ProviderWithArgKeys,
} from "./context";
import {
	type Ctor,
	type Factory,
	type KeyIfExtensible,
	type KeysForValueTuple,
	type MapToProperty,
	type Pretty,
	type InstanceRecord,
	type ProviderTag,
	type BroadenPrimitiveConst,
} from "./global";

export interface ServiceInfo<
	Provider extends ProviderWithArgKeys = ProviderWithArgKeys,
	Scope extends ScopeKey = ScopeKey,
> {
	readonly provider: Provider;
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
			Ctor<ContextServices[K]>,
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
				Factory<BroadenPrimitiveConst<I>> & ProviderTag<[]>,
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
	child(): ServiceContainerBuilder<ContextServices, Services>;
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

	child(): ServiceContainerBuilder<ContextServices, Services> {
		const singletonResolvers: Record<PropertyKey, () => unknown> = {};
		Object.entries(this.#impl).forEach(([k, v]) => {
			if (v.scope === SINGLETON) singletonResolvers[k] = this.resolver(k);
		});
		return new ServiceContainerImpl(
			this.#ctx,
			{ ...this.#impl },
			singletonResolvers,
		);
	}

	scope(): ServiceContainer<ContextServices, Services> {
		return this.child().build();
	}

	private resolver<const K extends keyof Services>(
		key: K,
	): () => ContextServices[K] {
		const cached = this.#resolvers[key];
		if (cached) return cached as any;

		const impl = this.#impl[key];
		const deps: PropertyKey[] = impl.provider[INJECTED];

		const argResolvers = deps.map((k) =>
			this.resolver(k as keyof ContextServices),
		);

		let construct: () => ContextServices[K];

		const isFactory = impl.kind === FACTORY;
		const provider = impl.provider as any;

		switch (argResolvers.length) {
			case 0: {
				construct = isFactory ? () => provider() : () => new provider();
				break;
			}
			case 1: {
				const [r0] = argResolvers;
				construct = isFactory
					? () => provider(r0())
					: () => new provider(r0());
				break;
			}
			case 2: {
				const [r0, r1] = argResolvers;
				construct = isFactory
					? () => provider(r0(), r1())
					: () => new provider(r0(), r1());
				break;
			}
			case 3: {
				const [r0, r1, r2] = argResolvers;
				construct = isFactory
					? () => provider(r0(), r1(), r2())
					: () => new provider(r0(), r1(), r2());
				break;
			}
			case 4: {
				const [r0, r1, r2, r3] = argResolvers;
				construct = isFactory
					? () => provider(r0(), r1(), r2(), r3())
					: () => new provider(r0(), r1(), r2(), r3());
				break;
			}
			case 5: {
				const [r0, r1, r2, r3, r4] = argResolvers;
				construct = isFactory
					? () => provider(r0(), r1(), r2(), r3(), r4())
					: () => new provider(r0(), r1(), r2(), r3(), r4());
				break;
			}
			case 6: {
				const [r0, r1, r2, r3, r4, r5] = argResolvers;
				construct = isFactory
					? () => provider(r0(), r1(), r2(), r3(), r4(), r5())
					: () => new provider(r0(), r1(), r2(), r3(), r4(), r5());
				break;
			}
			case 7: {
				const [r0, r1, r2, r3, r4, r5, r6] = argResolvers;
				construct = isFactory
					? // prettier-ignore
						() => provider(r0(), r1(), r2(), r3(), r4(), r5(), r6())
					: // prettier-ignore
						() => new provider(r0(), r1(), r2(), r3(), r4(), r5(), r6());
				break;
			}
			case 8: {
				const [r0, r1, r2, r3, r4, r5, r6, r7] = argResolvers;
				construct = isFactory
					? // prettier-ignore
						() => provider(r0(), r1(), r2(), r3(), r4(), r5(), r6(), r7())
					: // prettier-ignore
						() => new provider(r0(), r1(), r2(), r3(), r4(), r5(), r6(), r7());
				break;
			}
			default: {
				construct = isFactory
					? () => provider(...argResolvers.map((r) => r()))
					: () => new provider(...argResolvers.map((r) => r()));
				break;
			}
		}

		const resolver =
			impl.scope === TRANSIENT
				? construct
				: (() => {
						const instance = construct();
						return () => instance;
					})();

		this.#resolvers[key] = resolver;
		return resolver;
	}

	ctor<
		const K extends keyof ContextServices,
		const P extends CtorWithArgKeys<
			Ctor<ContextServices[K]>,
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
			provider: Object.assign(() => instance, {
				[INJECTED]: [],
				[PROVIDER]: true,
			}) as any,
			scope: SCOPE_MAP[scope],
			kind: FACTORY,
		};
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
