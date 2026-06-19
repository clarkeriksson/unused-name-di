export class DepsNotFoundError extends Error {
    constructor(key: PropertyKey, options?: ErrorOptions) {
        super(
            `could not find the dependencies of the service with key '${String(key)}'`,
            options,
        );
        if (
            "captureStackTrace" in Error &&
            typeof Error["captureStackTrace"] === "function"
        ) {
            Error.captureStackTrace(this, DepsNotFoundError);
        }
    }
}

export class ServiceNotFoundError extends Error {
    constructor(key: PropertyKey, options?: ErrorOptions) {
        super(`could not locate a service with key '${String(key)}'`, options);
        if (
            "captureStackTrace" in Error &&
            typeof Error["captureStackTrace"] === "function"
        ) {
            Error.captureStackTrace(this, ServiceNotFoundError);
        }
    }
}

export class SingletonOverrideError extends Error {
    constructor(key: PropertyKey, options?: ErrorOptions) {
        super(
            `attempted to override a singleton service with key '${String(key)}'`,
            options,
        );
        if (
            "captureStackTrace" in Error &&
            typeof Error["captureStackTrace"] === "function"
        ) {
            Error.captureStackTrace(this, SingletonOverrideError);
        }
    }
}
