import { KeyTypeInvariants } from "./global";
import {
	Constructor,
	Factory,
	KeysFromTypes,
	Provider,
	ProviderArgs,
	TaggedConstructor,
	TaggedFactory,
} from "./provider";
import { INJECTED_KEYS, PROVIDER_KIND, ProviderKind } from "./const";

const tag = <
	const Invariants extends KeyTypeInvariants,
	const TargetProvider extends Provider,
	const InjectedKeys extends KeysFromTypes<
		Invariants,
		ProviderArgs<TargetProvider>
	>,
>(
	provider: TargetProvider,
	keys: InjectedKeys,
	kind: ProviderKind,
) =>
	Object.setPrototypeOf(
		Object.assign((provider as any).bind(null), {
			[INJECTED_KEYS]: keys,
			[PROVIDER_KIND]: kind,
		}),
		provider,
	);

export const injector = <const Invariants extends KeyTypeInvariants>() => ({
	ctor: <
		const TargetConstructor extends Constructor,
		const InjectedKeys extends KeysFromTypes<
			Invariants,
			ProviderArgs<TargetConstructor>
		>,
	>(
		provider: TargetConstructor,
		...args: [] extends InjectedKeys
			? [injected?: InjectedKeys]
			: [injected: InjectedKeys]
	): TaggedConstructor<Invariants, TargetConstructor, InjectedKeys> =>
		tag<Invariants, TargetConstructor, InjectedKeys>(
			provider,
			(args[0] ?? []) as InjectedKeys,
			"constructor",
		),
	factory: <
		const TargetFactory extends Factory,
		const InjectedKeys extends KeysFromTypes<
			Invariants,
			ProviderArgs<TargetFactory>
		>,
	>(
		provider: TargetFactory,
		...args: [] extends InjectedKeys
			? [injected?: InjectedKeys]
			: [injected: InjectedKeys]
	): TaggedFactory<Invariants, TargetFactory, InjectedKeys> =>
		tag<Invariants, TargetFactory, InjectedKeys>(
			provider,
			(args[0] ?? []) as InjectedKeys,
			"factory",
		),
	instance: <const InstanceType>(
		instance: InstanceType,
	): TaggedFactory<Invariants, () => InstanceType, []> =>
		tag<Invariants, () => InstanceType, []>(() => instance, [], "factory"),
});
