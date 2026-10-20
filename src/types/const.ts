export type ProviderScope = "transient" | "scoped" | "singleton";
export type ProviderKind = "constructor" | "factory" | "instance";

export const INJECTED = Symbol();
export const PROVIDER = Symbol();
