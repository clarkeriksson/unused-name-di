import {
	ServiceContainer,
	ServiceContainerBuilder,
	ServiceContainerImpl,
	ServiceInfo,
} from "./container";
import { KeysForValueTuple, InstanceRecord, ProviderTag } from "./global";
import { KeyTypeInvariants } from "./types/context";
import {
	INJECTED,
	type Constructor,
	type ConstructorArgs,
	type Factory,
	type FactoryArgs,
	type Provider,
	type ProviderArgs,
} from "./types/provider";

export interface ServiceContext<S extends InstanceRecord = {}> {
	inject<
		const C extends Provider,
		const A extends KeysForValueTuple<S, ProviderArgs<C>>
	>(
		provider: C,
		...args: ProviderArgs<C> extends [] ? [args?: A] : [args: A]
	): C & ProviderTag<A>;

	child<I extends Record<PropertyKey, ServiceInfo>>(
		configure: (
			builder: ServiceContainerBuilder<S>
		) => ServiceContainerBuilder<S, I>
	): ServiceContainer<S, I>;
}

function wrapWithArgs<
	const Invariants extends KeyTypeInvariants,
	const TargetProvider extends Provider,
	const InjectedKeys extends KeysForValueTuple<
		Invariants,
		ProviderArgs<TargetProvider>
	>
>(
	provider: TargetProvider,
	...args: ProviderArgs<TargetProvider> extends []
		? [injected?: InjectedKeys]
		: [injected: InjectedKeys]
): TargetProvider & ProviderTag<InjectedKeys> {
	return Object.setPrototypeOf(
		Object.assign((provider as any).bind(null), { [INJECTED]: args[0] }),
		provider
	);
}

export class ServiceContextImpl<S extends InstanceRecord = {}>
	implements ServiceContext<S>
{
	inject<
		const C extends Provider,
		const A extends KeysForValueTuple<S, ProviderArgs<C>>
	>(
		provider: C,
		...args: ProviderArgs<C> extends [] ? [injected?: A] : [injected: A]
	): C & ProviderTag<A> {
		return wrapWithArgs<S, C, A>(provider, ...args);
	}

	child<I extends Record<PropertyKey, ServiceInfo>>(
		configure: (
			builder: ServiceContainerBuilder<S>
		) => ServiceContainerBuilder<S, I>
	): ServiceContainer<S, I> {
		const builder = new ServiceContainerImpl(this, {});
		return configure(builder).build();
	}
}

export type CtorWithArgKeys<
	P extends Constructor = Constructor,
	C extends InstanceRecord = any,
	A extends KeysForValueTuple<C, ConstructorArgs<P>> = any
> = P & ProviderTag<A>;

export type FactoryWithArgKeys<
	P extends Factory = Factory,
	C extends InstanceRecord = any,
	A extends KeysForValueTuple<C, FactoryArgs<P>> = any
> = P & ProviderTag<A>;

export type ProviderWithArgKeys<
	P extends Provider = Provider,
	C extends InstanceRecord = any,
	A extends KeysForValueTuple<C, ProviderArgs<P>> = any
> = P & ProviderTag<A>;
