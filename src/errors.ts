export class ServiceRegistrationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ServiceRegistrationError";
        if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, ServiceRegistrationError);
        }
    }
}

export class ServiceResolutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ServiceResolutionError";
        if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, ServiceRegistrationError);
        }
    }
}

export class InjectionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InjectionError";
        if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, InjectionError);
        }
    }
}

export class ContainerDisposedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ContainerDisposedError";
        if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, ContainerDisposedError);
        }
    }
}