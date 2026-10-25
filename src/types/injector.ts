import { BroadenPrimitiveConst, KeyTypeInvariants } from "./context";
import {
	Constructor,
	ConstructorArgs,
	Factory,
	KeysFromTypes,
	Provider,
	ProviderArgs,
	TaggedProvider,
} from "./provider";
import {
	ReturnKind,
	INJECTED_KEYS,
	PROVIDER_KIND,
	ProviderKind,
	RETURN_KIND,
	SyncReturn,
	AsyncReturn,
	ConstructorProvider,
	FactoryProvider,
} from "./const";

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
	): TaggedProvider<Invariants, TargetConstructor, InjectedKeys> =>
		tag<Invariants, TargetConstructor, InjectedKeys>(
			provider,
			args[0] as InjectedKeys,
			ConstructorProvider,
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
	): TaggedProvider<Invariants, TargetFactory, InjectedKeys> =>
		tag<Invariants, TargetFactory, InjectedKeys>(
			provider,
			args[0] as InjectedKeys,
			ConstructorProvider,
		),
});
// ({
// 	ctor: <
// 		const Service extends Invariants[keyof Invariants],
// 		const Arguments extends readonly Invariants[keyof Invariants][],
// 		const InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
// 	>(
// 		provider: Constructor<Service, Arguments>,
// 		...args: [] extends Arguments
// 			? [injected?: InjectedKeys]
// 			: [injected: InjectedKeys]
// 	): TaggedProvider<
// 		Invariants,
// 		Service,
// 		InjectedKeys
// 	> =>
// 		tag<
// 			Invariants,
// 			Service,
// 			Arguments,
// 			InjectedKeys,
// 			typeof SyncReturn
// 		>(
// 			provider,
// 			(args[0] ?? []) as any,
// 			ConstructorProvider,
// 			SyncReturn,
// 		),
// 	factory: <
// 		const Service extends Invariants[keyof Invariants],
// 		const Arguments extends readonly Invariants[keyof Invariants][],
// 		const InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
// 	>(
// 		provider: Factory<Service, Arguments>,
// 		...args: [] extends Arguments
// 			? [injected?: InjectedKeys]
// 			: [injected: InjectedKeys]
// 	): TaggedSyncFactory<
// 		Invariants,
// 		Service,
// 		Arguments,
// 		InjectedKeys
// 	> =>
// 		tag<
// 			Invariants,
// 			Service,
// 			Arguments,
// 			InjectedKeys,
// 			typeof SyncReturn
// 		>(
// 			provider,
// 			(args[0] ?? []) as any,
// 			FactoryProvider,
// 			SyncReturn,
// 		),
// }) as const;
