import {
	INJECTED_KEYS,
	ProviderKind,
	DependencyScope,
	ReturnKind,
	RETURN_KIND,
	PROVIDER_KIND,
	AsyncReturn,
	SyncReturn,
	ConstructorProvider,
	FactoryProvider,
} from "./const";
import { ProviderRegistrations } from "./container";
import { BroadenPrimitiveConst, KeyTypeInvariants } from "./context";

export type Constructor<
	T = any,
	A extends readonly any[] = readonly any[],
> = new (...args: A) => T;
export type ConstructorArgs<T> =
	T extends Constructor<any, infer A> ? A : never;
export type ConstructorReturn<T> =
	T extends Constructor<infer R, any> ? R : never;

export type Factory<T = any, A extends readonly any[] = readonly any[]> = (
	...args: A
) => T;
export type FactoryArgs<T> = T extends Factory<any, infer A> ? A : never;
export type FactoryReturn<T> = T extends Factory<infer R, any> ? R : never;

export type Provider<T = any, A extends readonly any[] = readonly any[]> =
	| Constructor<T, A>
	| Factory<T, A>;
export type ProviderArgs<T> = T extends Provider<any, infer A> ? A : never;
export type ProviderReturn<T> = T extends Provider<infer R, any> ? R : never;

export type KeysFromTypes<
	Invariants extends KeyTypeInvariants,
	Arguments extends readonly Invariants[keyof Invariants][],
> = {
	[K in keyof Arguments]: {
		[P in keyof Invariants]: Arguments[K] extends Invariants[P] ? P : never;
	}[keyof Invariants];
};

type ProviderTag<
	InjectedKeys extends KeysFromTypes<KeyTypeInvariants, readonly unknown[]>,
> = {
	readonly [INJECTED_KEYS]: InjectedKeys;
};

export type TaggedProvider<
	Invariants extends KeyTypeInvariants = any,
	TargetProvider extends Provider = any,
	InjectedKeys extends KeysFromTypes<
		Invariants,
		ProviderArgs<TargetProvider>
	> = any,
> = TargetProvider & ProviderTag<InjectedKeys>;

export type TaggedProviderInjectedKeys<T> =
	T extends ProviderTag<infer A> ? A : never;

export type EagerSyncConstructorInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Constructor<Invariants[Key]>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	provider(): Registration;
	readonly injected: TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: false;
	readonly async: false;
	readonly kind: typeof ConstructorProvider;
};

export type EagerSyncFactoryInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Factory<Invariants[Key]>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	provider(): Registration;
	readonly injected: TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: false;
	readonly async: false;
	readonly kind: typeof FactoryProvider;
};

export type EagerAsyncConstructorInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Constructor<Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Registration;
	get injected(): TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: false;
	readonly async: true;
	readonly kind: typeof ConstructorProvider;
};

export type EagerAsyncFactoryInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Factory<Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Registration;
	get injected(): TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: false;
	readonly async: true;
	readonly kind: typeof FactoryProvider;
};

export type LazySyncConstructorInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Constructor<
			Invariants[Key] extends Promise<infer Service> ? Service : never
		>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Promise<Registration>;
	get injected(): TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: true;
	readonly async: false;
	readonly kind: typeof ConstructorProvider;
};

export type LazySyncFactoryInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Factory<
			Invariants[Key] extends Promise<infer Service> ? Service : never
		>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Promise<Registration>;
	get injected(): TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: true;
	readonly async: false;
	readonly kind: typeof FactoryProvider;
};

export type LazyAsyncConstructorInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Constructor<Invariants[Key] | Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Promise<
		Constructor<
			| Promise<ConstructorReturn<Registration>>
			| ConstructorReturn<Registration>,
			ConstructorArgs<Registration>
		>
	>;
	get injected(): TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: true;
	readonly async: true;
	readonly kind: typeof ConstructorProvider;
};

export type LazyAsyncFactoryInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends TaggedProvider<
		Invariants,
		Factory<Invariants[Key] | Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Promise<
		Factory<
			Promise<FactoryReturn<Registration>> | FactoryReturn<Registration>,
			FactoryArgs<Registration>
		>
	>;
	get injected(): TaggedProviderInjectedKeys<Registration>;
	readonly scope: Scope;
	readonly lazy: true;
	readonly async: true;
	readonly kind: typeof FactoryProvider;
};

export type ProviderInfo<
	Invariants extends KeyTypeInvariants,
	Key extends keyof Invariants,
	TargetProvider extends TaggedProvider<Invariants>,
	Scope extends DependencyScope,
> =
	| EagerSyncConstructorInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Constructor<Invariants[Key]>
			>
				? TargetProvider
				: never,
			Scope
	  >
	| EagerSyncFactoryInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Factory<Invariants[Key]>
			>
				? TargetProvider
				: never,
			Scope
	  >
	| EagerAsyncConstructorInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Constructor<Promise<Invariants[Key]>>,
				any
			>
				? TargetProvider
				: never,
			Scope
	  >
	| EagerAsyncFactoryInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Factory<Promise<Invariants[Key]>>,
				any
			>
				? TargetProvider
				: never,
			Scope
	  >
	| LazySyncConstructorInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Constructor<
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
	| LazySyncFactoryInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Factory<
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
	| LazyAsyncConstructorInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Constructor<Invariants[Key] | Promise<Invariants[Key]>>,
				any
			>
				? TargetProvider
				: never,
			Scope
	  >
	| LazyAsyncFactoryInfo<
			Invariants,
			Key,
			TargetProvider extends TaggedProvider<
				Invariants,
				Factory<Invariants[Key] | Promise<Invariants[Key]>>,
				any
			>
				? TargetProvider
				: never,
			Scope
	  >;

// export type ProviderInfo<
// 	TargetProvider extends TaggedProvider<any, any, any, any>,
// 	Scope extends DependencyScope,
// > =
// 	| EagerProviderInfo<TargetProvider, Scope>
// 	| LazyProviderInfo<TargetProvider, Scope>;

export type InherentAsyncResolvingService =
	| EagerAsyncConstructorInfo
	| LazyAsyncConstructorInfo
	| EagerAsyncFactoryInfo
	| LazyAsyncFactoryInfo;

export type RequiresAsyncResolver<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
	Key extends keyof Invariants,
> = Providers[Key] extends InherentAsyncResolvingService
	? true
	: Providers[Key] extends ProviderInfo<
				Invariants,
				Key,
				TaggedProvider<Invariants, Provider, infer InjectedKeys>,
				DependencyScope
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

export type DependencyResolverReturn<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
	Key extends keyof Invariants,
> =
	RequiresAsyncResolver<Invariants, Providers, Key> extends true
		? Promise<Invariants[Key]>
		: Invariants[Key];

// export type TaggedProvider<
// 	Invariants extends KeyTypeInvariants,
// 	Service extends Invariants[keyof Invariants],
// 	Arguments extends readonly Invariants[keyof Invariants][],
// 	InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
// 	Return extends ReturnKind,
// > = Provider<
// 	ReturnKind extends typeof AsyncReturn ? Promise<Service> : Service,
// 	Arguments
// > & {
// 	readonly [INJECTED_KEYS]: InjectedKeys;
// 	readonly [RETURN_KIND]: Return;
// 	readonly [PROVIDER_KIND]: ProviderKind;
// };

// export type EagerProviderInfo<
// 	Invariants extends KeyTypeInvariants,
// 	Service extends Invariants[keyof Invariants],
// 	Arguments extends readonly Invariants[keyof Invariants][],
// 	InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
// 	Scope extends DependencyScope,
// > = {
// 	provider: TaggedProvider<Invariants, Service, Arguments, InjectedKeys>;
// 	readonly scope: Scope;
// };

// export type LazyProviderInfo<
// 	Invariants extends KeyTypeInvariants,
// 	Service extends Invariants[keyof Invariants],
// 	Arguments extends readonly Invariants[keyof Invariants][],
// 	InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
// 	Scope extends DependencyScope,
// > = {
// 	provider: TaggedProvider<Invariants, Service, Arguments, InjectedKeys>;
// 	readonly scope: Scope;
// 	importProvider: () => Promise<
// 		TaggedProvider<Invariants, Service, Arguments, InjectedKeys>
// 	>;
// };

// export type ProviderInfo<
// 	Invariants extends KeyTypeInvariants,
// 	Service extends Invariants[keyof Invariants],
// 	Arguments extends readonly Invariants[keyof Invariants][],
// 	InjectedKeys extends KeysFromTypes<Invariants, Arguments>,
// 	Scope extends DependencyScope,
// > =
// 	| EagerProviderInfo<Invariants, Service, Arguments, InjectedKeys, Scope>
// 	| LazyProviderInfo<Invariants, Service, Arguments, InjectedKeys, Scope>;
