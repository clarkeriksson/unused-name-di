export const TRANSIENT = Symbol("transient");
export const SCOPED = Symbol("scoped");
export const SINGLETON = Symbol("singleton");

export const ServiceScope = {
    transient: TRANSIENT,
    scoped: SCOPED,
    singleton: SINGLETON,
} as const;

export type ServiceScopeToken = {
    [K in keyof typeof ServiceScope]: (typeof ServiceScope)[K];
}[keyof typeof ServiceScope];

export type ServiceScopeKey = keyof typeof ServiceScope;

export const ARGS = Symbol("args");
export const UNUSED_NAME_SERVICE = Symbol("unusednameservice");
