import type { Provider, ProviderReturn } from "./provider";

/**
 * Type improving the mouseover preview of the argument type.
 * @param T
 */
export declare type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type KeyTypeInvariants = Record<PropertyKey, unknown>;
