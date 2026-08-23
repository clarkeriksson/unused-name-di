import { INJECTED, PROVIDER } from "./const";
import {
	ServiceContainer,
	ServiceContainerBuilder,
	ServiceContainerImpl,
	ServiceInfo,
} from "./container";
import {
	Ctor,
	CtorArgs,
	Creator,
	CreatorArgs,
	Factory,
	FactoryArgs,
	KeysForValueTuple,
	InstanceRecord,
	ProviderTag,
} from "./global";

export interface ServiceContext<S extends InstanceRecord = {}> {
	inject<
		const C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>,
	>(
		provider: C,
		...args: CreatorArgs<C> extends [] ? [args?: A] : [args: A]
	): C & ProviderTag<A>;

	child<I extends Record<PropertyKey, ServiceInfo>>(
		configure: (
			builder: ServiceContainerBuilder<S>,
		) => ServiceContainerBuilder<S, I>,
	): ServiceContainer<S, I>;

	isProvider<
		C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>,
	>(
		value: C,
	): value is C & ProviderTag<A>;
}

export class ServiceContextImpl<
	S extends InstanceRecord = {},
> implements ServiceContext<S> {
	#args: Map<Creator, PropertyKey[]>;

	constructor() {
		this.#args = new Map();
	}

	inject<
		const C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>,
	>(
		provider: C,
		...args: CreatorArgs<C> extends [] ? [args?: A] : [args: A]
	): C & ProviderTag<A> {
		const argArr = (args[0] as A) ?? [];
		this.#args.set(provider, argArr);
		return Object.assign(provider, {
			[INJECTED]: argArr,
			[PROVIDER]: true as const,
		});
	}

	child<I extends Record<PropertyKey, ServiceInfo>>(
		configure: (
			builder: ServiceContainerBuilder<S>,
		) => ServiceContainerBuilder<S, I>,
	): ServiceContainer<S, I> {
		const builder = new ServiceContainerImpl(this, {});
		return configure(builder).build();
	}

	isProvider<
		C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>,
	>(value: C): value is C & ProviderTag<A> {
		const args = this.#args.get(value);
		if (!args || !(PROVIDER in value)) return false;
		return (
			INJECTED in value &&
			args.every((v, i) => v === (value[INJECTED] as any[])[i])
		);
	}
}

export type CtorWithArgKeys<
	Provider extends Ctor = Ctor,
	Context extends InstanceRecord = any,
	Args extends KeysForValueTuple<Context, CtorArgs<Provider>> = any,
> = Provider & ProviderTag<Args>;

export type FactoryWithArgKeys<
	Provider extends Factory = Factory,
	Context extends InstanceRecord = any,
	Args extends KeysForValueTuple<Context, FactoryArgs<Provider>> = any,
> = Provider & ProviderTag<Args>;

export type ProviderWithArgKeys<
	Provider extends Creator = Creator,
	Context extends InstanceRecord = any,
	Args extends KeysForValueTuple<Context, CreatorArgs<Provider>> = any,
> = Provider & ProviderTag<Args>;
