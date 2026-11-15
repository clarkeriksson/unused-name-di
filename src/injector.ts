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
import { DependencyContainer } from "./container";
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

/**
 * Creates an object exposing methods to prepare {@link Provider providers} for use in
 * {@link DependencyContainer containers} that follow the given {@link Invariants}.
 * @returns The method exposing object.
 */
export const injector = <const Invariants extends KeyTypeInvariants>() => ({
	/**
	 * Creates an augmented version of the given {@link TargetConstructor} to include required dependency injection
	 * metadata so that it may be used in {@link DependencyContainer} registrations.
	 * @param provider The service constructor.
	 * @param injected The injected service keys, if the constructor has arguments.
	 * @returns The prepared constructor.
	 */
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
	/**
	 * Creates an augmented version of the given {@link TargetFactory} to include required dependency injection
	 * metadata so that it may be used in {@link DependencyContainer} registrations.
	 * @param provider The service factory.
	 * @param injected The injected service keys, if the factory has arguments.
	 * @returns The prepared factory.
	 */
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
	/**
	 * Creates a prepared version of a given object that can be used in {@link DependencyContainer} registrations.
	 * @param instance The object.
	 * @returns The prepared instance.
	 */
	instance: <const InstanceType>(
		instance: InstanceType,
	): TaggedFactory<Invariants, () => InstanceType, []> =>
		tag<Invariants, () => InstanceType, []>(() => instance, [], "factory"),
});
