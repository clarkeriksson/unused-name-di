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

/** {@link Symbol} property key for the argument metadata in registered services. */
export const ARGS = Symbol("args");

/** {@link Symbol} property key tagging a constructor or factory as a registered service provider. */
export const UNUSED_NAME_SERVICE = Symbol("unused-name-service");
