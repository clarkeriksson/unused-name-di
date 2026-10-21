export type ProviderScopeKey = "transient" | "scoped" | "singleton";
export type ProviderKindKey = "constructor" | "factory" | "instance";

export const Injected = Symbol();
export const Async = Symbol();
export const ProviderKind = Symbol();
