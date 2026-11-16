import { type ProviderKindKey, type DependencyScopeKey } from "./const";
import { type ProviderRegistrations } from "./container";
import { type KeyTypeInvariants } from "./global";
import { InjectedKeys, ProviderKind } from "./const";

/**
 * Represents a constructor that returns type {@link T} and takes in arguments of tuple type {@link A}.
 */
export type Constructor<
	T = any,
	A extends readonly any[] = readonly any[],
> = new (...args: A) => T;

/**
 * Provides a tuple type of the arguments of a {@link Constructor}.
 */
export type ConstructorArgs<T> =
	T extends Constructor<any, infer A> ? A : never;

/**
 * Provides the return type of a {@link Constructor}.
 */
export type ConstructorReturn<T> =
	T extends Constructor<infer R, any> ? R : never;

/**
 * Represents a factory that returns type {@link T} and takes in arguments of tuple type {@link A}.
 */
export type Factory<T = any, A extends readonly any[] = readonly any[]> = (
	...args: A
) => T;

/**
 * Provides a tuple type of the arguments of a {@link Factory}.
 */
export type FactoryArgs<T> = T extends Factory<any, infer A> ? A : never;

/**
 * Provides the return type of a {@link Factory}.
 */
export type FactoryReturn<T> = T extends Factory<infer R, any> ? R : never;

/**
 * Represents either a {@link Constructor} or a {@link Factory} type that returns type {@link T} and takes in arguments
 * or tuple type {@link A}.
 */
export type Provider<T = any, A extends readonly any[] = readonly any[]> =
	| Constructor<T, A>
	| Factory<T, A>;

/**
 * Provides a tuple type of the arguments of a {@link Provider}.
 */
export type ProviderArgs<T> = T extends Provider<any, infer A> ? A : never;

/**
 * Provides the return type of a {@link Provider}.
 */
export type ProviderReturn<T> = T extends Provider<infer R, any> ? R : never;

/**
 * Provides a tuple type of service keys associated with the given {@link Arguments} tuple type of {@link Provider}
 * arguments given a specific {@link Invariants} configuration.
 */
export type KeysFromTypes<
	Invariants extends KeyTypeInvariants,
	Arguments extends readonly Invariants[keyof Invariants][],
> = {
	[K in keyof Arguments]: {
		[P in keyof Invariants]: Arguments[K] extends Invariants[P]
			? P
			: Arguments[K] extends Promise<Invariants[P]>
				? P
				: never;
	}[keyof Invariants];
};

/**
 * Represents metadata attached to a {@link Provider} carrying around information on the kind of {@link Provider} and
 * the services to inject as arguments.
 */
type ProviderTag<
	Invariants extends KeyTypeInvariants,
	TargetProvider extends Provider,
	InjectedKeys extends KeysFromTypes<
		Invariants,
		ProviderArgs<TargetProvider>
	>,
	Kind extends ProviderKindKey,
> = {
	readonly [InjectedKeys]: InjectedKeys;
	readonly [ProviderKind]: Kind;
};

/**
 * Represents a {@link Constructor} with a {@link ProviderTag}.
 */
export type TaggedConstructor<
	Invariants extends KeyTypeInvariants = any,
	TargetProvider extends Constructor = any,
	InjectedKeys extends KeysFromTypes<
		Invariants,
		ProviderArgs<TargetProvider>
	> = any,
> = TargetProvider &
	ProviderTag<Invariants, TargetProvider, InjectedKeys, "constructor">;

/**
 * Represents a {@link Factory} with a {@link ProviderTag}.
 */
export type TaggedFactory<
	Invariants extends KeyTypeInvariants = any,
	TargetProvider extends Factory = any,
	InjectedKeys extends KeysFromTypes<
		Invariants,
		ProviderArgs<TargetProvider>
	> = any,
> = TargetProvider &
	ProviderTag<Invariants, TargetProvider, InjectedKeys, "factory">;

/**
 * Represents a {@link Provider} with a {@link ProviderTag}.
 */
export type TaggedProvider<
	Invariants extends KeyTypeInvariants = any,
	TargetProvider extends Provider = any,
	InjectedKeys extends KeysFromTypes<
		Invariants,
		ProviderArgs<TargetProvider>
	> = any,
> = TargetProvider extends Constructor
	? TaggedConstructor<
			Invariants,
			TargetProvider extends Constructor ? TargetProvider : never,
			InjectedKeys
		>
	: TaggedFactory<
			Invariants,
			TargetProvider extends Factory ? TargetProvider : never,
			InjectedKeys
		>;

/**
 * Extracts the injected service key tuple type from a {@link ProviderTag}.
 */
export type TaggedProviderInjectedKeys<T> =
	T extends ProviderTag<any, any, infer A, any> ? A : never;

/**
 * Represents the registration info for an eagerly imported, synchronous return {@link TaggedProvider} being assigned
 * to be a container service.
 */
export type EagerSyncProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Provider<Invariants[Key]>,
		any
	> = any,
	Scope extends DependencyScopeKey = any,
> = {
	provider: Registration;
	awaitedArgs: number[] | null;
	readonly scope: Scope;
	readonly lazy: false;
	readonly awaited: false;
	kind: ProviderKindKey;
};

/**
 * Represents the registration info for an eagerly imported, asynchronous return {@link TaggedProvider} being assigned
 * to be a container service.
 */
export type EagerAwaitedProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Provider<Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScopeKey = any,
> = {
	provider: Registration;
	awaitedArgs: number[] | null;
	readonly scope: Scope;
	readonly lazy: false;
	readonly awaited: true;
	kind: ProviderKindKey;
};

/**
 * Represents the registration info for a lazily imported, synchronous return {@link TaggedProvider} being assigned
 * to be a container service.
 */
export type LazySyncProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Provider<
			Invariants[Key] extends Promise<infer Service> ? Service : never
		>,
		any
	> = any,
	Scope extends DependencyScopeKey = any,
> = {
	provider: Registration;
	awaitedArgs: number[] | null;
	importProvider(): Promise<Registration>;
	readonly scope: Scope;
	readonly lazy: true;
	readonly awaited: false;
	kind: ProviderKindKey;
};

/**
 * Represents the registration info for a lazily imported, asynchronous return {@link TaggedProvider} being assigned
 * to be a container service.
 */
export type LazyAwaitedProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Provider<Invariants[Key] | Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScopeKey = any,
> = {
	provider: Registration;
	awaitedArgs: number[] | null;
	importProvider(): Promise<Registration>;
	readonly scope: Scope;
	readonly lazy: true;
	readonly awaited: true;
	kind: ProviderKindKey;
};

/**
 * Represents the registration info for a {@link TaggedProvider} being assigned to be a container service.
 */
export type ProviderInfo<
	Invariants extends KeyTypeInvariants,
	Key extends keyof Invariants,
	TargetProvider extends TaggedProvider,
	Scope extends DependencyScopeKey,
> =
	| EagerSyncProviderInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Provider<Invariants[Key]>
			>
				? TargetProvider
				: never,
			Scope
	  >
	| EagerAwaitedProviderInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Provider<Promise<Invariants[Key]>>,
				any
			>
				? TargetProvider
				: never,
			Scope
	  >
	| LazySyncProviderInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Provider<
					Invariants[Key] extends Promise<infer Service>
						? Service
						: never
				>,
				any
			>
				? TargetProvider
				: never,
			Scope
	  >
	| LazyAwaitedProviderInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Provider<Invariants[Key] | Promise<Invariants[Key]>>,
				any
			>
				? TargetProvider
				: never,
			Scope
	  >;

/**
 * {@link ProviderInfo} types that must be directly awaited, rather than awaited due to an awaited dependency.
 */
export type DirectlyAwaitedService =
	| EagerAwaitedProviderInfo
	| LazyAwaitedProviderInfo;

/**
 * Type returning {@link true} if the given {@link Key} type is associated with a service that must be resolved
 * asynchronously, and {@link false} otherwise.
 */
export type RequiresAsyncResolver<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
	Key extends keyof Invariants,
> = Providers[Key] extends DirectlyAwaitedService
	? true
	: Providers[Key] extends ProviderInfo<
				Invariants,
				Key,
				TaggedProvider<Invariants, Provider, infer InjectedKeys>,
				DependencyScopeKey
		  >
		? {
				[K in keyof Invariants]: K extends {
					[I in keyof InjectedKeys]: InjectedKeys[I];
				}[keyof InjectedKeys]
					? RequiresAsyncResolver<
							Invariants,
							Providers,
							K
						> extends true
						? true
						: never
					: never;
			}[keyof Invariants] extends never
			? false
			: true
		: false;

/**
 * Type of the return when resolving the given {@link Key} from the {@link Providers} configuration.
 */
export type DependencyResolverReturn<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
	Key extends keyof Invariants,
> =
	RequiresAsyncResolver<Invariants, Providers, Key> extends true
		? Promise<Invariants[Key]>
		: Invariants[Key];

/**
 * Type of the service resolvers for each service key.
 */
export type Resolvers<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
> = {
	[Key in keyof Providers]: () => DependencyResolverReturn<
		Invariants,
		Providers,
		Key
	>;
};
