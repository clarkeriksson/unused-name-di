/**
 * @file File containing simple constant values and any types derived from them that are used in this package.
 */

/** {@link Symbol} representing a transient service scope token. */
export const TRANSIENT = Symbol("transient");
/** {@link Symbol} representing a scoped service scope token. */
export const SCOPED = Symbol("scoped");
/** {@link Symbol} representing a singleton service scope token. */
export const SINGLETON = Symbol("singleton");

/** Utility object defining the map from service scope strings to service scope symbols. */
export const SERVICE_SCOPE_MAP = {
    transient: TRANSIENT,
    scoped: SCOPED,
    singleton: SINGLETON,
} as const;

/** The union type of all service scope tokens. */
export type ServiceScopeToken = {
    [K in keyof typeof SERVICE_SCOPE_MAP]: (typeof SERVICE_SCOPE_MAP)[K];
}[keyof typeof SERVICE_SCOPE_MAP];

/** The union type of all service scope strings. */
export type ServiceScopeKey = keyof typeof SERVICE_SCOPE_MAP;

/** Type representing the {@link ServiceScopeToken} corresponding to the {@link ServiceScopeKey}. */
export type ServiceScopeTokenFromKey<K extends ServiceScopeKey> =
    (typeof SERVICE_SCOPE_MAP)[K];

/** {@link Symbol} representing a constructor. */
export const CTOR = Symbol("ctor");

/** {@link Symbol} representing a factory. */
export const FACTORY = Symbol("factory");

/** Utility object defining the map from service provider type keys to provider type symbols. */
export const PROVIDER_TYPE_MAP = {
    ctor: CTOR,
    factory: FACTORY,
} as const;

/** The union type of all service provider type tokens. */
export type ProviderTypeToken = {
    [K in keyof typeof PROVIDER_TYPE_MAP]: (typeof PROVIDER_TYPE_MAP)[K];
}[keyof typeof PROVIDER_TYPE_MAP];

/** The union type of all service provider type strings. */
export type ProviderTypeKey = keyof typeof PROVIDER_TYPE_MAP;

/** Type representing the {@link ProviderTypeToken} corresponding to the {@link ProviderTypeKey}. */
export type ProviderTypeTokenFromKey<K extends ProviderTypeKey> =
    (typeof PROVIDER_TYPE_MAP)[K];

/** {@link Symbol} property key for the argument metadata in registered services. */
export const ARGS = Symbol("args");

/** {@link Symbol} property key tagging a constructor or factory as a registered service provider. */
export const UNUSED_NAME_SERVICE = Symbol("unused-name-service");
