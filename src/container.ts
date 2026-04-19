import { ContainerDisposedError } from "./errors.js";
import {
    RAW_PROVIDER,
    ServiceInfoImpl,
    ServiceScope,
    type ServiceArgs,
    type ServiceInfo,
    type ServiceInstance,
    type ServiceProvider,
} from "./service.js";

/**
 * Utility type to simplify and expand certain object type previews.
 */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Type returning the broad primitive type for primitive const type inputs, otherwise the type passes through.
 */
type Broaden<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends symbol
          ? symbol
          : T extends bigint
            ? bigint
            : T;

/**
 * Tuple type of service keys corresponding to services matching the provided tuple of values.
 */
export type KeysForValues<
    T extends Record<PropertyKey, ServiceInfo>,
    Values extends readonly any[],
> = {
    [Index in keyof Values]: {
        [Key in keyof T]: Values[Index] extends Broaden<
            ServiceInstance<T[Key]["factory"]>
        >
            ? Key
            : never;
    }[keyof T];
};

/**
 * Returns a tuple type of all keys in the given services record type that match the given service scope.
 */
type ServiceScopeKeys<
    Services extends Record<PropertyKey, ServiceInfo>,
    Scope extends ServiceScope,
> = {
    [Key in keyof Services]: Services[Key] extends ServiceInfo<Scope>
        ? Key
        : never;
}[keyof Services];

/**
 * Returns never if the provided key is already associated with a service info type with scope 'singleton', otherwise
 * returns the key.
 */
type KeyIfNotExistingSingletonKey<
    Services extends Record<PropertyKey, ServiceInfo>,
    Key extends PropertyKey,
> = Key extends ServiceScopeKeys<Services, "singleton"> ? never : Key;

/**
 * Object returned from registration methods to specify a service and optionally a type for that service.
 */
type RegistrationHandler<
    Services extends Record<PropertyKey, ServiceInfo>,
    Key extends PropertyKey,
    Scope extends ServiceScope,
> = {
    /**
     * Registers the service provider and associated service given by the provided getter function. Returns an updated
     * {@link InjectionContainerBuilder} to continue registration. The optional generic type parameter can be used to
     * register the service implementation under the given interface.
     *
     * @param lazy A getter function returning a service provider for the service being registered.
     */
    use<
        Service extends Key extends keyof Services
            ? ServiceInstance<Services[Key]["factory"]>
            : unknown,
    >(
        lazy: () => ServiceProvider<Service>,
    ): InjectionContainerBuilder<
        Prettify<
            Omit<Services, Key> & {
                [K in Key]: ServiceInfo<
                    Scope,
                    Key extends keyof Services
                        ? ServiceInstance<Services[Key]["factory"]>
                        : Service
                >;
            }
        >
    >;
};

export interface InjectionContainerBuilder<
    Services extends Record<PropertyKey, ServiceInfo> = {},
> {
    /**
     * **Singleton services resolve to the same instance for all child containers of the defining container.**
     *
     * Begins the registration of a singleton service assigned to the given key.
     *
     * _WARNING: Since singleton services are the same across child containers, it is important to recognize that any
     * non-singleton dependencies of this service will be derived from the container it is registered in. Because of
     * this it is recommended to only have singleton dependencies, but not strictly prohibited by this library._
     *
     * @param key The key to assign the service to.
     * @returns A {@link RegistrationHandler} object with the {@link RegistrationHandler.use use} method to complete
     * registration.
     */
    singleton<Key extends PropertyKey>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
    ): RegistrationHandler<Services, Key, "singleton">;

    /**
     * **Scoped services resolve to the same instance within a container.**
     *
     * Begins the registration of a scoped service assigned to the given key.
     *
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    scoped<Key extends PropertyKey>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
    ): RegistrationHandler<Services, Key, "scoped">;

    /**
     * **Transient services always resolve to a new instance.**
     *
     * Begins the registration of a transient service assigned to the given key.
     *
     * @param key The key to assign the service to.
     * @returns An object containing the 'use' method to complete registration of the service.
     */
    transient<Key extends PropertyKey>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
    ): RegistrationHandler<Services, Key, "transient">;

    /**
     * Constructs a container object from this builder.
     */
    build(): InjectionContainer<Services>;
}

/**
 * A dependency injection container. Multiple containers can exist.
 */
export interface InjectionContainer<
    Services extends Record<PropertyKey, ServiceInfo> = {},
> {
    /**
     * Takes in a service constructor or factory and returns a function to specify the services to inject as parameters
     * via a list of strongly-typed service keys.
     *
     * @param provider The target constructor or factory.
     * @returns A function taking in the keys associated with services to inject.
     */
    inject<P extends ServiceProvider>(
        provider: P,
    ): {
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(
            ...keys: Keys
        ): void;
    };

    /**
     * Provides an instance of the service associated with the given key, in compliance with the configuration.
     *
     * @param key The service key.
     * @returns An instance of the associated service.
     */
    resolve<Key extends keyof Services>(
        key: Key,
    ): ServiceInstance<Services[Key]["factory"]>;

    /**
     * An object providing a decorator-specific injection method. Can only be used on class definitions and only
     * requires keys associated with the services to inject. This is for TS5+ decorators matching the upcoming
     * ECMAScript decorator feature, not experimental legacy decorators. This can be called outside of that context,
     * but the type inference fails in those scenarios. Prefer the {@link InjectionContainer.inject} method instead.
     */
    readonly dec: {
        inject<
            const Keys extends KeysForValues<Services, ServiceArgs<P>>,
            P extends ServiceProvider,
        >(
            ...keys: Keys
        ): (provider: P) => void;
    };

    /**
     * Creates a new container that inherits the configuration from the calling container. Can be extended upon without
     * disrupting the parent container.
     */
    child(): InjectionContainerBuilder<Services>;

    /**
     * Releases object references.
     */
    dispose(): void;

    /**
     * Disposal method required for use of the 'using' keyword in modern ECMAScript environments.
     */
    [Symbol.dispose](): void;
}

export class InjectionContainerBuilderImpl<
    Services extends Record<PropertyKey, ServiceInfo> = {},
> implements InjectionContainerBuilder<Services> {
    #disposed: boolean = false;

    _serviceInfo: Record<PropertyKey, ServiceInfoImpl> = {};
    _implToDeps: Map<ServiceProvider, PropertyKey[]> = new Map();
    _resolverCache: Map<PropertyKey, () => any> = new Map();

    private _register<Key extends PropertyKey, Scope extends ServiceScope>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
        scope: Scope,
    ): RegistrationHandler<Services, Key, Scope> {
        if (
            key in this._serviceInfo &&
            this._serviceInfo[key].scope === "singleton"
        )
            throw Error(
                `Attempted to override the singleton service ${String(key)}`,
            );
        return {
            use: <Service>(
                lazy: () => ServiceProvider<Service>,
            ): InjectionContainerBuilder<
                Prettify<
                    Omit<Services, Key> & {
                        [K in Key]: ServiceInfo<Scope, Service>;
                    }
                >
            > => {
                const _info = this._serviceInfo as Record<
                    PropertyKey,
                    ServiceInfo
                >;
                if (key in this._serviceInfo) this._resolverCache.delete(key);
                _info[key] = new ServiceInfoImpl(scope, lazy);
                return this as any;
            },
        };
    }

    singleton<Key extends PropertyKey>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
    ) {
        return this._register(key, "singleton");
    }

    scoped<Key extends PropertyKey>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
    ) {
        return this._register(key, "scoped");
    }

    transient<Key extends PropertyKey>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
    ) {
        return this._register(key, "transient");
    }

    build(): InjectionContainer<Services> {
        const result = new InjectionContainerImpl();
        result._serviceInfo = this._serviceInfo;
        result._implToDeps = this._implToDeps;
        result._resolverCache = this._resolverCache;
        return result as unknown as InjectionContainer<Services>;
    }
}

export class InjectionContainerImpl<
    Services extends Record<PropertyKey, ServiceInfo> = {},
> implements InjectionContainer<Services> {
    #disposed: boolean = false;

    _serviceInfo: Record<PropertyKey, ServiceInfoImpl> = {};
    _implToDeps: Map<ServiceProvider, PropertyKey[]> = new Map();
    _resolverCache: Map<PropertyKey, () => any> = new Map();

    inject<P extends ServiceProvider, const Keys extends KeysForValues<Services, ServiceArgs<P>>>(
        provider: P,
    ): {
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(
            ...keys: Keys
        ): void;
    } {
        if (this.#disposed) throw new ContainerDisposedError("Attempted to inject from a disposed container");
        return (...keys) => {
            this._implToDeps.set(provider, keys);
        };
    }

    resolve<Key extends keyof Services>(
        key: Key,
    ): ServiceInstance<Services[Key]["factory"]> {
        if (this.#disposed) throw new ContainerDisposedError("Attempted to resolve from a disposed container");
        const resolver = this._ensureResolverCached(key);
        return resolver();
    }

    child(): InjectionContainerBuilder<Services> {
        if (this.#disposed) throw new ContainerDisposedError("Attempted to create a child from a disposed container");

        const result = new InjectionContainerBuilderImpl();
        result._serviceInfo = {};

        const infoEntries = Object.entries(this._serviceInfo);
        for (const [k, v] of infoEntries) {
            const curr = v._derive();
            if (v.scope === "singleton") {
                const resolver = this._ensureResolverCached(k);
                result._resolverCache.set(k, resolver);
            }
            result._serviceInfo[k] = curr;
        }

        const depsEntries = this._implToDeps.entries();
        for (const [k, v] of depsEntries) {
            const curr = [...v];
            result._implToDeps.set(k, curr);
        }

        return result as unknown as InjectionContainerBuilder<Services>;
    }

    private _ensureResolverCached<Key extends keyof Services>(
        key: Key,
    ): () => ServiceInstance<Services[Key]["factory"]> {
        const cached = this._resolverCache.get(key);
        if (cached) return cached;

        const info = this._serviceInfo[key];
        if (!info) throw new Error(`No service for key '${String(key)}' found`);

        const depKeys = this._implToDeps.get(info[RAW_PROVIDER]) ?? [];

        let argResolvers = depKeys.map((depKey) =>
            this._ensureResolverCached(depKey),
        );
        const resolveArgs = () => argResolvers.map((r) => r());

        const resolve = () => info.factory(...resolveArgs());

        const resolver =
            info.scope === "singleton" || info.scope === "scoped"
                ? (() => {
                      const instance = resolve();
                      return () => instance;
                  })()
                : resolve;

        this._resolverCache.set(key, resolver);
        return resolver;
    }

    readonly dec: {
        inject<
            const Keys extends KeysForValues<Services, ServiceArgs<P>>,
            const P extends ServiceProvider,
        >(
            ...keys: Keys
        ): (provider: P) => void;
    } = {
        inject: <
            const Keys extends KeysForValues<Services, ServiceArgs<P>>,
            const P extends ServiceProvider,
        >(
            ...keys: Keys
        ): ((provider: P) => void) => {
            if (this.#disposed) throw new ContainerDisposedError("Attempted to inject from a disposed container");
            return (provider) => {
                this._implToDeps.set(provider, keys);
            };
        },
    };

    dispose(): void {
        if (this.#disposed) return;
        this.#disposed = true;

        this._serviceInfo = {};
        this._implToDeps.clear();
        this._resolverCache.clear();
    }

    [Symbol.dispose]() {
        this.dispose();
    }
}
