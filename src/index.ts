import { Pretty } from "./global";
import {
	DependencyContainer,
	DependencyContainerBuilder,
	DependencyContainerImpl,
	ProviderRegistrations,
} from "./container";
import { type KeyTypeInvariants } from "./global";
import { injector } from "./injector";

const context = <const Invariants extends KeyTypeInvariants>() => ({
	root<const ChildProviders extends ProviderRegistrations<Invariants>>(
		configure: (
			builder: DependencyContainerBuilder<Invariants, {}>,
		) => DependencyContainerBuilder<Invariants, ChildProviders>,
	): DependencyContainer<Invariants, Pretty<ChildProviders>> {
		const container = new DependencyContainerImpl({});
		return configure(
			container as DependencyContainerBuilder<Invariants, ChildProviders>,
		).build();
	},
});

export { context, injector };
