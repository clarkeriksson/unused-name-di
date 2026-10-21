import { KeyTypeInvariants } from "./types/context";
import {
	Constructor,
	Factory,
	Provider,
	TaggedProvider,
} from "./types/provider";
import { Async, Injected, ProviderKind, ProviderKindKey } from "./types/const";

const tag = <
	const Invariants extends KeyTypeInvariants,
	const Service extends Invariants[keyof Invariants],
	const Arguments extends readonly Invariants[keyof Invariants][],
	const InjectedKeys extends {
		[K in keyof Arguments]: {
			[P in keyof Invariants]: Arguments[K] extends Invariants[P]
				? P
				: never;
		}[keyof Invariants];
	},
	const Async extends boolean,
	const ProviderKind extends ProviderKindKey,
>(
	provider: Async extends true
		? Provider<Promise<Service>, Arguments>
		: Provider<Service, Arguments>,
	keys: InjectedKeys,
	kind: ProviderKind,
	async: Async,
) =>
	Object.setPrototypeOf(
		Object.assign((provider as any).bind(null), {
			[Injected]: keys,
			[Async]: async,
			[ProviderKind]: kind,
		}),
		provider,
	);

export const injector = <const Invariants extends KeyTypeInvariants>() =>
	({
		sync: {
			ctor: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends {
					[K in keyof Arguments]: {
						[P in keyof Invariants]: Arguments[K] extends Invariants[P]
							? P
							: never;
					}[keyof Invariants];
				},
			>(
				provider: Constructor<Service, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedProvider<
				Invariants,
				Service,
				Arguments,
				InjectedKeys,
				false
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					false,
					"constructor"
				>(provider, (args[0] ?? []) as any, "constructor", false),
			factory: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends {
					[K in keyof Arguments]: {
						[P in keyof Invariants]: Arguments[K] extends Invariants[P]
							? P
							: never;
					}[keyof Invariants];
				},
			>(
				provider: Factory<Service, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedProvider<
				Invariants,
				Service,
				Arguments,
				InjectedKeys,
				false
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					false,
					"factory"
				>(provider, (args[0] ?? []) as any, "factory", false),
		} as const,
		async: {
			ctor: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends {
					[K in keyof Arguments]: {
						[P in keyof Invariants]: Arguments[K] extends Invariants[P]
							? P
							: never;
					}[keyof Invariants];
				},
			>(
				provider: Constructor<Promise<Service>, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedProvider<
				Invariants,
				Service,
				Arguments,
				InjectedKeys,
				true
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					true,
					"constructor"
				>(provider, (args[0] ?? []) as any, "constructor", true),
			factory: <
				const Service extends Invariants[keyof Invariants],
				const Arguments extends readonly Invariants[keyof Invariants][],
				const InjectedKeys extends {
					[K in keyof Arguments]: {
						[P in keyof Invariants]: Arguments[K] extends Invariants[P]
							? P
							: never;
					}[keyof Invariants];
				},
			>(
				provider: Factory<Promise<Service>, Arguments>,
				...args: [] extends Arguments
					? [injected?: InjectedKeys]
					: [injected: InjectedKeys]
			): TaggedProvider<
				Invariants,
				Service,
				Arguments,
				InjectedKeys,
				true
			> =>
				tag<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					true,
					"factory"
				>(provider, (args[0] ?? []) as any, "factory", true),
		} as const,
	}) as const;
