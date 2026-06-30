export class UnusedNameError extends Error {
	readonly key: PropertyKey;
	constructor(key: PropertyKey) {
		super();
		this.key = key;
	}
}

export class DepsNotFoundError extends UnusedNameError {}
export class ServiceNotFoundError extends UnusedNameError {}
export class SingletonOverrideError extends UnusedNameError {}
export class KeyReuseError extends UnusedNameError {}
