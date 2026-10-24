import { type DependencyContext } from "./types/context";
import { type KeyTypeInvariants } from "./types/context";
import { injector } from "./types/injector";

const context = <T extends KeyTypeInvariants>(): DependencyContext<T> =>
	null as unknown as DependencyContext<T>;

export { context, injector };
