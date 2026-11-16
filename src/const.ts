/**
 * Possible values for the scope of a registered dependency.
 */
export type DependencyScopeKey = "transient" | "scoped" | "singleton";

/**
 * Possible values for the kind of service provider.
 */
export type ProviderKindKey = "constructor" | "factory";

/**
 * Symbol used as a key for injected dependency metadata.
 */
export const InjectedKeys = Symbol();

/**
 * Symbol used as a key for {@link ProviderKindKey} metadata.
 */
export const ProviderKind = Symbol();
