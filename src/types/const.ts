export type DependencyScope = "transient" | "scoped" | "singleton";

export const SyncReturn = Symbol();
export const AsyncReturn = Symbol();
export type ReturnKind = typeof SyncReturn | typeof AsyncReturn;

export const ConstructorProvider = Symbol();
export const FactoryProvider = Symbol();
export type ProviderKind = typeof ConstructorProvider | typeof FactoryProvider;

export const INJECTED_KEYS = Symbol();
export const RETURN_KIND = Symbol();
export const PROVIDER_KIND = Symbol();
