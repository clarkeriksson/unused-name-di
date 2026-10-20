import { KeysForValueTuple, ProviderTag } from "./global";
import { KeyTypeInvariants } from "./types/context";
import { Provider, ProviderArgs } from "./types/provider";
import { INJECTED } from "./types/const";

export type Injector<Invariants extends KeyTypeInvariants> = <
	const TargetProvider extends Provider,
	const InjectedKeys extends KeysForValueTuple<
		Invariants,
		ProviderArgs<TargetProvider>
	>
>(
	provider: TargetProvider,
	...args: ProviderArgs<TargetProvider> extends []
		? [injected?: InjectedKeys]
		: [injected: InjectedKeys]
) => TargetProvider & ProviderTag<InjectedKeys>;

export function injector<
	const Invariants extends KeyTypeInvariants
>(): Injector<Invariants> {
	return (provider, ...args) => {
		return Object.setPrototypeOf(
			Object.assign((provider as any).bind(null), {
				[INJECTED]: args[0],
			}),
			provider
		);
	};
}
