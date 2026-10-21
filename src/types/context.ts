import {
	DependencyContainer,
	DependencyContainerBuilder,
	ProviderRegistrations,
} from "./container";
import { Provider, ProviderArgs, TaggedProvider } from "./provider";

export declare type BroadenPrimitiveConst<T> = T extends string
	? string
	: T extends number
		? number
		: T extends boolean
			? boolean
			: T;

export type KeyTypeInvariants = Record<PropertyKey, unknown>;
export type KeyTupleForTypeTuple<
	TypeTuple extends Invariants[keyof Invariants][],
	Invariants extends KeyTypeInvariants,
> = {
	[Index in keyof TypeTuple]: {
		[Key in keyof Invariants]: BroadenPrimitiveConst<
			Invariants[Key]
		> extends TypeTuple[Index]
			? Key
			: never;
	}[keyof Invariants];
};

type TestInvariants = {
	key0: string;
	key1: number;
	key2: boolean;
	key3: string;
};

type KeyTuple = KeyTupleForTypeTuple<[number, string], TestInvariants>;

export interface DependencyContext<Invariants extends KeyTypeInvariants> {
	inject<
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
		provider: Provider<Service, Arguments>,
		...args: Arguments extends []
			? [args?: InjectedKeys]
			: [args: InjectedKeys]
	): TaggedProvider<Invariants, Service, Arguments, InjectedKeys, false>;

	injectAsync<
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
		provider: Provider<Promise<Service>, Arguments>,
		...args: Arguments extends []
			? [args?: InjectedKeys]
			: [args: InjectedKeys]
	): TaggedProvider<Invariants, Service, Arguments, InjectedKeys, true>;

	container<ContainerProviders extends ProviderRegistrations<Invariants>>(
		build: (
			builder: DependencyContainerBuilder<Invariants, {}>,
		) => DependencyContainerBuilder<Invariants, ContainerProviders>,
	): DependencyContainer<Invariants, ContainerProviders>;
}
