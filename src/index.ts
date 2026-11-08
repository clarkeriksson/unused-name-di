import { Pretty } from "./global";
import {
	DependencyContainer,
	DependencyContainerBuilder,
	DependencyContainerImpl,
	ProviderRegistrations,
} from "./container";
import { type KeyTypeInvariants } from "./global";
import { injector } from "./injector";

const root = <
	const Invariants extends KeyTypeInvariants,
>(): DependencyContainer<Invariants, {}> =>
	new DependencyContainerImpl<Invariants, {}>({});

export { root, injector };
