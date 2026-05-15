import { ContainerDisposedError } from "./errors.js";
import { BroadenPrimitiveConst, Prettify } from "./global.js";
import {
    RAW_PROVIDER,
    ServiceConstructor,
    ServiceFactory,
    ServiceInfoImpl,
    ServiceScope,
    type ServiceArgs,
    type ServiceInfo,
    type ServiceInstance,
    type ServiceProvider,
} from "./service.js";

export const CONTAINER = Symbol("unused-name-di-container");

export const INJECT = Symbol("unused-name-di-inject");

/**
 * Tuple type of service keys corresponding to services matching the provided tuple of values.
 */
export type KeysForValues<
    T extends Record<PropertyKey, ServiceInfo>,
    Values extends readonly any[],
> = {
    [Index in keyof Values]: {
        [Key in keyof T]: BroadenPrimitiveConst<
            ServiceInstance<T[Key]["provider"]>
        > extends Values[Index]
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
            ? ServiceInstance<Services[Key]["provider"]>
            : unknown,
    >(
        lazy: () => ServiceProvider<Service>,
        options?: { kind: "factory" | "class" },
    ): InjectionContainerBuilder<
        Prettify<
            Omit<Services, Key> & {
                [K in Key]: ServiceInfo<
                    Scope,
                    Key extends keyof Services
                        ? ServiceInstance<Services[Key]["provider"]>
                        : Service
                >;
            }
        >
    >;
};

type AsyncRegistrationHandler<
    Services extends Record<PropertyKey, ServiceInfo>,
    Key extends PropertyKey,
    Scope extends ServiceScope,
> = {
    use<
        Service extends Key extends keyof Services
            ? ServiceInstance<Services[Key]["provider"]>
            : unknown,
    >(
        lazyPromise: () =>
            | Promise<ServiceProvider<Service>>
            | ServiceProvider<Service>,
        options?: { kind: "factory" | "class" },
    ): AsyncInjectionContainerBuilder<
        Prettify<
            Omit<Services, Key> & {
                [K in Key]: ServiceInfo<
                    Scope,
                    Key extends keyof Services
                        ? ServiceInstance<Services[Key]["provider"]>
                        : Service
                >;
            }
        >
    >;
};

export interface AsyncInjectionContainerBuilder<
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
    ): AsyncRegistrationHandler<Services, Key, "singleton">;

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
    ): AsyncRegistrationHandler<Services, Key, "scoped">;

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
    ): AsyncRegistrationHandler<Services, Key, "transient">;

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
     * Constructs a container object from this builder.
     */
    build(): Promise<
        InjectionContainer<
            Prettify<Services & { [CONTAINER]: InjectionContainer<Services> }>
        >
    >;
}

export class AsyncInjectionContainerBuilderImpl<
    Services extends Record<PropertyKey, ServiceInfo> = {},
> implements AsyncInjectionContainerBuilder<Services> {
    #disposed: boolean = false;

    #regPromises: {
        key: PropertyKey;
        scope: ServiceScope;
        importer: () => Promise<ServiceProvider<any>>;
        kind: "class" | "factory";
    }[] = [];

    _serviceInfo: Record<PropertyKey, ServiceInfoImpl> = {};
    _implToDeps: Map<ServiceProvider, PropertyKey[]> = new Map();
    _resolverCache: Map<PropertyKey, () => any> = new Map();

    private _register<Key extends PropertyKey, Scope extends ServiceScope>(
        key: KeyIfNotExistingSingletonKey<Services, Key>,
        scope: Scope,
    ): AsyncRegistrationHandler<Services, Key, Scope> {
        if (
            key in this._serviceInfo &&
            this._serviceInfo[key].scope === "singleton"
        )
            throw Error(
                `Attempted to override the singleton service ${String(key)}`,
            );
        return {
            use: <Service>(
                lazyPromise: () => Promise<ServiceProvider<Service>>,
                options: { kind: "factory" | "class" } = { kind: "class" },
            ): AsyncInjectionContainerBuilder<
                Prettify<
                    Omit<Services, Key> & {
                        [K in Key]: ServiceInfo<Scope, Service>;
                    }
                >
            > => {
                this.#regPromises.push(
                    // new Promise<void>(async (resolve) => {
                    //     // const awaited = await lazyPromise();
                    //     // if (key in this._serviceInfo)
                    //     //     this._resolverCache.delete(key);
                    //     // this._serviceInfo[key] = new ServiceInfoImpl(
                    //     //     scope,
                    //     //     awaited,
                    //     // );
                    //     resolve();
                    // }),
                    {
                        key,
                        scope,
                        importer: lazyPromise,
                        kind: options.kind,
                    },
                );
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

    inject<P extends ServiceProvider>(
        provider: P,
    ): {
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(
            ...keys: Keys
        ): void;
    } {
        if (this.#disposed)
            throw new ContainerDisposedError(
                "Attempted to inject from a disposed container",
            );
        console.log(provider);
        return (...keys) => {
            this._implToDeps.set(provider, keys);
        };
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
            if (this.#disposed)
                throw new ContainerDisposedError(
                    "Attempted to inject from a disposed container",
                );
            return (provider) => {
                this._implToDeps.set(provider, keys);
            };
        },
    };

    async build(): Promise<
        InjectionContainer<
            Prettify<Services & { [CONTAINER]: InjectionContainer<Services> }>
        >
    > {
        const resolved = await Promise.all(
            this.#regPromises.map(async (reg) => ({
                key: reg.key,
                scope: reg.scope,
                provider: await reg.importer(),
                kind: reg.kind,
            })),
        );

        for (const { key, scope, provider, kind } of resolved) {
            if (key in this._serviceInfo) this._resolverCache.delete(key);
            this._serviceInfo[key] = new ServiceInfoImpl(
                scope,
                () => provider,
                kind,
            );
        }

        const result =
            new InjectionContainerImpl() as InjectionContainerImpl<Services>;

        this._resolverCache.delete(CONTAINER);
        this._serviceInfo[CONTAINER] = new ServiceInfoImpl(
            "scoped",
            () => () => result,
            "factory",
        );

        result._serviceInfo = this._serviceInfo;
        result._implToDeps = this._implToDeps;
        result._resolverCache = this._resolverCache;
        return result as unknown as InjectionContainer<Services>;
    }
}

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
     * Constructs a container object from this builder.
     */
    build(): InjectionContainer<
        Prettify<Services & { [CONTAINER]: InjectionContainer<Services> }>
    >;
}

/**
 * A dependency injection container. Multiple containers can exist.
 */
export interface InjectionContainer<
    Services extends Record<PropertyKey, ServiceInfo> = {},
> {
    /**
     * Provides an instance of the service associated with the given key, in compliance with the configuration.
     *
     * @param key The service key.
     * @returns An instance of the associated service.
     */
    resolve<Key extends keyof Services>(
        key: Key,
    ): ServiceInstance<Services[Key]["provider"]>;

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
                options: { kind: "factory" | "class" } = { kind: "class" },
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
                _info[key] = new ServiceInfoImpl(scope, lazy, options.kind);
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

    inject<P extends ServiceProvider>(
        provider: P,
    ): {
        <const Keys extends KeysForValues<Services, ServiceArgs<P>>>(
            ...keys: Keys
        ): void;
    } {
        if (this.#disposed)
            throw new ContainerDisposedError(
                "Attempted to inject from a disposed container",
            );
        return (...keys) => {
            this._implToDeps.set(provider, keys);
        };
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
            if (this.#disposed)
                throw new ContainerDisposedError(
                    "Attempted to inject from a disposed container",
                );
            return (provider) => {
                this._implToDeps.set(provider, keys);
            };
        },
    };

    build(): InjectionContainer<
        Prettify<Services & { [CONTAINER]: InjectionContainer<Services> }>
    > {
        const result = new InjectionContainerImpl();

        this._resolverCache.delete(CONTAINER);
        this._serviceInfo[CONTAINER] = new ServiceInfoImpl(
            "scoped",
            () => () => result,
            "factory",
        );

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

    resolve<Key extends keyof Services>(
        key: Key,
    ): ServiceInstance<Services[Key]["provider"]> {
        if (this.#disposed)
            throw new ContainerDisposedError(
                "Attempted to resolve from a disposed container",
            );
        const resolver = this._ensureResolverCached(key);
        return resolver();
    }

    child(): InjectionContainerBuilder<Services> {
        if (this.#disposed)
            throw new ContainerDisposedError(
                "Attempted to create a child from a disposed container",
            );

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
    ): () => ServiceInstance<Services[Key]["provider"]> {
        const cached = this._resolverCache.get(key);
        if (cached) return cached;

        const info = this._serviceInfo[key];
        if (!info) throw new Error(`No service for key '${String(key)}' found`);

        const depKeys = this._implToDeps.get(info.provider) ?? [];

        let argResolvers = depKeys.map((depKey) =>
            this._ensureResolverCached(depKey),
        );
        const resolveArgs = () => argResolvers.map((r) => r());

        let resolve: () => ServiceInstance<Services[Key]["provider"]>;
        if (info.kind === "class") {
            try {
                resolve = () =>
                    new (info.provider as ServiceConstructor)(...resolveArgs());
            } catch {
                throw new Error(
                    `unable to resolve service '${key.toString()}' as a class, ensure it is registered as the correct kind`,
                );
            }
        } else {
            try {
                resolve = () =>
                    (info.provider as ServiceFactory)(...resolveArgs());
            } catch {
                throw new Error(
                    `unable to resolve service '${key.toString()}' as a factory, ensure it is registered as the correct kind`,
                );
            }
        }

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

const ARGS = Symbol("args");
export type ServiceWithMetadata<
    S = unknown,
    Args extends readonly any[] = any[],
> = S & { readonly [ARGS]: Args };

export function toService<P extends ServiceProvider>(
    provider: P,
    args: ServiceArgs,
);
