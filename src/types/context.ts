import {
	DependencyContainer,
	DependencyContainerBuilder,
	ProviderRegistrations,
} from "./container";
import { Provider, ProviderArgs, ProviderTag } from "./provider";

export declare type BroadenPrimitiveConst<T> = T extends string
	? string
	: T extends number
	? number
	: T extends boolean
	? boolean
	: T;

export type KeyTypeInvariants = Record<PropertyKey, unknown>;
export type KeyTupleForTypeTuple<
	TypeTuple extends readonly {
		[K in keyof Invariants]: Invariants[K];
	}[keyof Invariants][],
	Invariants extends KeyTypeInvariants
> = Readonly<{
	[Index in keyof TypeTuple]: {
		[Key in keyof Invariants]: BroadenPrimitiveConst<
			Invariants[Key]
		> extends TypeTuple[Index]
			? Key
			: never;
	}[keyof Invariants];
}>;

type TestInvariants = {
	key0: string;
	key1: number;
	key2: boolean;
};

type KeyTuple = KeyTupleForTypeTuple<[number, string], TestInvariants>;

export interface DependencyContext<Invariants extends KeyTypeInvariants> {
	inject<
		const TargetProvider extends Provider,
		const InjectedKeys extends KeyTupleForTypeTuple<
			ProviderArgs<TargetProvider>,
			Invariants
		>
	>(
		provider: TargetProvider,
		...args: ProviderArgs<TargetProvider> extends []
			? [args?: InjectedKeys]
			: [args: InjectedKeys]
	): TargetProvider & ProviderTag<Invariants, InjectedKeys>;

	container<ContainerProviders extends ProviderRegistrations<Invariants>>(
		build: (
			builder: DependencyContainerBuilder<Invariants, {}>
		) => DependencyContainerBuilder<Invariants, ContainerProviders>
	): DependencyContainer<Invariants, ContainerProviders>;
}
