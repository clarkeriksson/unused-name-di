import { Constructor, ConstructorArgs, Provider } from "./types/provider";

function injectable<T extends Provider, const M extends Record<string, any>>(
	provider: T,
	meta: M
): T & M {
	return Object.setPrototypeOf(
		Object.assign((provider as any).bind(null), meta),
		provider
	);
}
