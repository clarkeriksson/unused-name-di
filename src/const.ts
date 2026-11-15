/**
 * Possible values for the scope of a registered dependency.
 */
export type DependencyScope = "transient" | "scoped" | "singleton";

/**
 * Possible values for the kind of service provider.
 */
export type ProviderKind = "constructor" | "factory";

/**
 * Symbol used as a key for injected dependency metadata.
 */
export const INJECTED_KEYS = Symbol();

/**
 * Symbol used as a key for {@link ProviderKind} metadata.
 */
export const PROVIDER_KIND = Symbol();
