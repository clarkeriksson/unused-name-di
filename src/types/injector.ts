import { BroadenPrimitiveConst, KeyTypeInvariants } from "./context";
import {
	Constructor,
	Factory,
	KeysFromTypes,
	Provider,
	TaggedAsyncConstructor,
	TaggedAsyncFactory,
	TaggedProvider,
	TaggedSyncConstructor,
	TaggedSyncFactory,
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
	const Service extends Invariants[keyof Invariants],
	const Arguments extends readonly Invariants[keyof Invariants][],
	const InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
	const Return extends ReturnKind,
>(
	provider: Return extends typeof AsyncReturn
		? Provider<Promise<Service>, Arguments>
		: Provider<Service, Arguments>,
	keys: InjectedKeys,
	kind: ProviderKind,
	async: Return,
) =>
	Object.setPrototypeOf(
		Object.assign((provider as any).bind(null), {
			[INJECTED_KEYS]: keys,
			[RETURN_KIND]: async,
			[PROVIDER_KIND]: kind,
		}),
		provider,
	);

export const injector = <const Invariants extends KeyTypeInvariants>() =>
	({
		sync: {
			ctor: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
			>(
				provider: Constructor<Service, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedSyncConstructor<
				Invariants,
				Service,
				Arguments,
				InjectedKeys
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					typeof SyncReturn
				>(
					provider,
					(args[0] ?? []) as any,
					ConstructorProvider,
					SyncReturn,
				),
			factory: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
			>(
				provider: Factory<Service, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedSyncFactory<
				Invariants,
				Service,
				Arguments,
				InjectedKeys
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					typeof SyncReturn
				>(
					provider,
					(args[0] ?? []) as any,
					FactoryProvider,
					SyncReturn,
				),
		} as const,
		async: {
			ctor: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
			>(
				provider: Constructor<Promise<Service>, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedAsyncConstructor<
				Invariants,
				Service,
				Arguments,
				InjectedKeys
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					typeof AsyncReturn
				>(
					provider,
					(args[0] ?? []) as any,
					ConstructorProvider,
					AsyncReturn,
				),
			factory: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
			>(
				provider: Factory<Promise<Service>, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedAsyncFactory<
				Invariants,
				Service,
				Arguments,
				InjectedKeys
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					typeof AsyncReturn
				>(
					provider,
					(args[0] ?? []) as any,
					FactoryProvider,
					AsyncReturn,
				),
		} as const,
	}) as const;
