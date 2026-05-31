export const TRANSIENT = Symbol("transient");
export const SCOPED = Symbol("scoped");
export const SINGLETON = Symbol("singleton");

export const SERVICE_SCOPE_MAP = {
    transient: TRANSIENT,
    scoped: SCOPED,
    singleton: SINGLETON,
} as const;

export type ServiceScopeToken = {
    [K in keyof typeof SERVICE_SCOPE_MAP]: (typeof SERVICE_SCOPE_MAP)[K];
}[keyof typeof SERVICE_SCOPE_MAP];

export type ServiceScopeKey = keyof typeof SERVICE_SCOPE_MAP;

export const ARGS = Symbol("args");
export const UNUSED_NAME_SERVICE = Symbol("unused-name-service");
