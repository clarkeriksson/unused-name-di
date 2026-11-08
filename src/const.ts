export type DependencyScope = "transient" | "scoped" | "singleton";

export type ProviderKind = "constructor" | "factory";

export const INJECTED_KEYS = Symbol();
export const RETURN_KIND = Symbol();
export const PROVIDER_KIND = Symbol();
