import { Pretty } from "../global";
import {
	DependencyContainer,
	DependencyContainerBuilder,
	ProviderRegistrations,
} from "./container";

export declare type BroadenPrimitiveConst<T> = T extends string
	? string
	: T extends number
		? number
		: T extends boolean
			? boolean
			: T;

export type KeyTypeInvariants = Record<PropertyKey, unknown>;

export interface DependencyContext<Invariants extends KeyTypeInvariants> {
	container<ContainerProviders extends ProviderRegistrations<Invariants>>(
		build: (
			builder: DependencyContainerBuilder<Invariants, {}>,
		) => DependencyContainerBuilder<Invariants, ContainerProviders>,
	): DependencyContainer<Invariants, Pretty<ContainerProviders>>;
}
