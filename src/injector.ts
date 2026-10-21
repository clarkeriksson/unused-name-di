import { KeyTypeInvariants } from "./types/context";
import { Constructor, Factory, TaggedProvider } from "./types/provider";
import { Async, Injected, ProviderKind, ProviderKindKey } from "./types/const";

export const injector = <const Invariants extends KeyTypeInvariants>() =>
	({
		sync: {
			constructor: <
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
				Object.setPrototypeOf(
					Object.assign((provider as any).bind(null), {
						[Injected]: args[0],
						[Async]: false,
						[ProviderKind]: "constructor",
					}),
					provider,
				),
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
				Object.setPrototypeOf(
					Object.assign((provider as any).bind(null), {
						[Injected]: args[0],
						[Async]: false,
						[ProviderKind]: "factory",
					}),
					provider,
				),
		} as const,
		async: {
			constructor: <
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
				Object.setPrototypeOf(
					Object.assign((provider as any).bind(null), {
						[Injected]: args[0],
						[Async]: true,
						[ProviderKind]: "constructor",
					}),
					provider,
				),
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
				Object.setPrototypeOf(
					Object.assign((provider as any).bind(null), {
						[Injected]: args[0],
						[Async]: true,
						[ProviderKind]: "factory",
					}),
					provider,
				),
		} as const,
	}) as const;
