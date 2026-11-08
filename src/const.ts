export type DependencyScope = "transient" | "scoped" | "singleton";

export type ProviderKind = "constructor" | "factory";

export const INJECTED_KEYS = Symbol();
export const PROVIDER_KIND = Symbol();
