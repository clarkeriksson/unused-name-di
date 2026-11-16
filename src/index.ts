import { type DependencyContainer, DependencyContainerImpl } from "./container";
import { type KeyTypeInvariants } from "./global";
import { injector } from "./injector";

/**
 * Creates a configurationless {@link DependencyContainer} to serve as the root container for a given set of
 * {@link Invariants}. Should not be used as a container for resolving services itself.
 * @returns The root container.
 */
const root = <
	const Invariants extends KeyTypeInvariants,
>(): DependencyContainer<Invariants, {}> =>
	new DependencyContainerImpl<Invariants, {}>({});

export { root, injector };
