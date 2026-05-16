export class ProviderTypeError extends Error {
    constructor(
        key: PropertyKey,
        expected: "class" | "factory",
        options?: ErrorOptions,
    ) {
        super(
            `could not locate a service with key '${String(key)}' and provider type ${expected}`,
            options,
        );
        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(this, ProviderTypeError);
        }
    }
}

export class DepsNotFoundError extends Error {
    constructor(key: PropertyKey, options?: ErrorOptions) {
        super(
            `could not find the dependencies of the service with key '${String(key)}'`,
            options,
        );
        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(this, DepsNotFoundError);
        }
    }
}

export class ServiceNotFoundError extends Error {
    constructor(key: PropertyKey, options?: ErrorOptions) {
        super(`could not locate a service with key '${String(key)}'`, options);
        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(this, ServiceNotFoundError);
        }
    }
}
