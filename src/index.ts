import { Pretty } from "./global";
import {
	DependencyContainer,
	DependencyContainerBuilder,
	DependencyContainerImpl,
	ProviderRegistrations,
} from "./types/container";
import { type DependencyContext } from "./types/context";
import { type KeyTypeInvariants } from "./types/context";
import { injector } from "./types/injector";

const context = <const Invariants extends KeyTypeInvariants>() => ({
	root<const ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, {}>
		) => DependencyContainerBuilder<Invariants, ChildProviders>
	): DependencyContainer<Invariants, Pretty<ChildProviders>> {
		const container = new DependencyContainerImpl({});
		return configure(
			container as DependencyContainerBuilder<Invariants, ChildProviders>
		).build();
	},
});

export { context, injector };
