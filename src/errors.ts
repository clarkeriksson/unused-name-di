export class DepsNotFoundError extends Error {
	constructor(key: PropertyKey) {
		super(
			`could not find the dependencies of the service with key '${String(
				key
			)}'`
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
	constructor(key: PropertyKey) {
		super(`could not locate a service with key '${String(key)}'`);
		if (
			"captureStackTrace" in Error &&
			typeof Error["captureStackTrace"] === "function"
		) {
			Error.captureStackTrace(this, ServiceNotFoundError);
		}
	}
}

export class SingletonOverrideError extends Error {
	constructor(key: PropertyKey) {
		super(
			`attempted to override a singleton service with key '${String(
				key
			)}'`
		);
		if (
			"captureStackTrace" in Error &&
			typeof Error["captureStackTrace"] === "function"
		) {
			Error.captureStackTrace(this, SingletonOverrideError);
		}
	}
}
