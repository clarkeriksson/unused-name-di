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

type EagerProviderInfo<
	TargetTaggedProvider extends ProviderRegistration<any, any, any, any>,
	Scope extends DependencyScope,
> = {
	provider(): TargetTaggedProvider;
	readonly scope: Scope;
	readonly lazy: false;
};

type LazyProviderInfo<
	TargetTaggedProvider extends ProviderRegistration<any, any, any, any>,
	Scope extends DependencyScope,
> = {
	provider(): Promise<TargetTaggedProvider>;
	readonly scope: Scope;
	readonly lazy: true;
};

export type ProviderRegistration<
	Invariants extends KeyTypeInvariants = any,
	TargetProvider extends Provider = any,
	InjectedKeys extends KeysFromTypes<
		Invariants,
		ProviderArgs<TargetProvider>
	> = any,
> = {
	readonly provider: TargetProvider;
	readonly injected: InjectedKeys;
};

export type EagerSyncProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends ProviderRegistration<
		Invariants,
		Provider<Invariants[Key]>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	provider(): Registration["provider"];
	readonly injected: Registration["injected"];
	readonly scope: Scope;
	readonly lazy: false;
	readonly async: false;
};

export type EagerAsyncProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends ProviderRegistration<
		Invariants,
		Provider<Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Registration["provider"];
	get injected(): Registration["injected"];
	readonly scope: Scope;
	readonly lazy: false;
	readonly async: true;
};

export type LazySyncProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends ProviderRegistration<
		Invariants,
		Provider<
			Invariants[Key] extends Promise<infer Service> ? Service : never
		>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Promise<Registration["provider"]>;
	get injected(): Registration["injected"];
	readonly scope: Scope;
	readonly lazy: true;
	readonly async: false;
};

export type LazyAsyncProviderInfo<
	Invariants extends KeyTypeInvariants = any,
	Key extends keyof Invariants = any,
	Registration extends ProviderRegistration<
		Invariants,
		Provider<Invariants[Key] | Promise<Invariants[Key]>>,
		any
	> = any,
	Scope extends DependencyScope = any,
> = {
	get provider(): Promise<
		Provider<
			| Promise<ProviderReturn<Registration["provider"]>>
			| ProviderReturn<Registration["provider"]>,
			ProviderArgs<Registration["provider"]>
		>
	>;
	get injected(): Registration["injected"];
	readonly scope: Scope;
	readonly lazy: true;
	readonly async: true;
};

export type LazySyncConstructorInfo<
	TargetConstructor extends ProviderRegistration,
	Scope extends DependencyScope,
> = LazyProviderInfo<TargetConstructor, Scope>;

export type EagerAsyncConstructorInfo<
	TargetConstructor extends TaggedAsyncConstructor<any, any, any, any>,
	Scope extends DependencyScope,
> = EagerProviderInfo<TargetConstructor, Scope>;

export type LazyAsyncConstructorInfo<
	TargetConstructor extends TaggedAsyncConstructor<any, any, any, any>,
	Scope extends DependencyScope,
> = LazyProviderInfo<TargetConstructor, Scope>;

export type LazySyncFactoryInfo<
	TargetFactory extends TaggedSyncFactory<any, any, any, any>,
	Scope extends DependencyScope,
> = LazyProviderInfo<TargetFactory, Scope>;

export type EagerAsyncFactoryInfo<
	TargetFactory extends TaggedAsyncFactory<any, any, any, any>,
	Scope extends DependencyScope,
> = EagerProviderInfo<TargetFactory, Scope>;

export type LazyAsyncFactoryInfo<
	TargetFactory extends TaggedAsyncFactory<any, any, any, any>,
	Scope extends DependencyScope,
> = LazyProviderInfo<TargetFactory, Scope>;

export type TaggedProvider<
	Invariants extends KeyTypeInvariants = any,
	Service extends Invariants[keyof Invariants] = any,
	Arguments extends readonly Invariants[keyof Invariants][] = any,
	InjectedKeys extends KeysFromTypes<Invariants, Arguments> = any,
> =
	| TaggedSyncConstructor<Invariants, Service, Arguments, InjectedKeys>
	| TaggedAsyncConstructor<Invariants, Service, Arguments, InjectedKeys>
	| TaggedSyncFactory<Invariants, Service, Arguments, InjectedKeys>
	| TaggedAsyncFactory<Invariants, Service, Arguments, InjectedKeys>;

export type EagerTaggedProviderToInfo<
	TargetProvider extends ProviderRegistration,
	Scope extends DependencyScope,
> = TargetProvider extends TaggedSyncConstructor
	? EagerSyncConstructorInfo<TargetProvider, Scope>
	: TargetProvider extends TaggedAsyncConstructor
		? EagerAsyncConstructorInfo<TargetProvider, Scope>
		: TargetProvider extends TaggedSyncFactory
			? EagerSyncFactoryInfo<TargetProvider, Scope>
			: TargetProvider extends TaggedAsyncFactory
				? EagerAsyncFactoryInfo<TargetProvider, Scope>
				: never;

export type LazyTaggedProviderToInfo<
	TargetProvider extends ProviderRegistration,
	Scope extends DependencyScope,
> = TargetProvider extends TaggedSyncConstructor
	? LazySyncConstructorInfo<TargetProvider, Scope>
	: TargetProvider extends TaggedAsyncConstructor
		? LazyAsyncConstructorInfo<TargetProvider, Scope>
		: TargetProvider extends TaggedSyncFactory
			? LazySyncFactoryInfo<TargetProvider, Scope>
			: TargetProvider extends TaggedAsyncFactory
				? LazyAsyncFactoryInfo<TargetProvider, Scope>
				: never;

export type ProviderInfo<
	TargetProvider extends ProviderRegistration = ProviderRegistration,
	Scope extends DependencyScope = DependencyScope,
> =
	| EagerSyncConstructorInfo<
			TargetProvider extends TaggedSyncConstructor
				? TargetProvider
				: never,
			Scope
	  >
	| LazySyncConstructorInfo<
			TargetProvider extends TaggedSyncConstructor
				? TargetProvider
				: never,
			Scope
	  >
	| EagerAsyncConstructorInfo<
			TargetProvider extends TaggedAsyncConstructor
				? TargetProvider
				: never,
			Scope
	  >
	| LazyAsyncConstructorInfo<
			TargetProvider extends TaggedAsyncConstructor
				? TargetProvider
				: never,
			Scope
	  >
	| EagerSyncFactoryInfo<
			TargetProvider extends TaggedSyncFactory ? TargetProvider : never,
			Scope
	  >
	| LazySyncFactoryInfo<
			TargetProvider extends TaggedSyncFactory ? TargetProvider : never,
			Scope
	  >
	| EagerAsyncFactoryInfo<
			TargetProvider extends TaggedAsyncFactory ? TargetProvider : never,
			Scope
	  >
	| LazyAsyncFactoryInfo<
			TargetProvider extends TaggedAsyncFactory ? TargetProvider : never,
			Scope
	  >;

// export type ProviderInfo<
// 	TargetProvider extends TaggedProvider<any, any, any, any>,
// 	Scope extends DependencyScope,
// > =
// 	| EagerProviderInfo<TargetProvider, Scope>
// 	| LazyProviderInfo<TargetProvider, Scope>;

export type TaggedAsyncProvider<
	Invariants extends KeyTypeInvariants = any,
	Service extends Invariants[keyof Invariants] = any,
	Arguments extends readonly Invariants[keyof Invariants][] = any,
	InjectedKeys extends KeysFromTypes<Invariants, Arguments> = any,
> =
	| TaggedAsyncConstructor<Invariants, Service, Arguments, InjectedKeys>
	| TaggedAsyncFactory<Invariants, Service, Arguments, InjectedKeys>;

export type InherentAsyncResolvingService =
	| { provider(): { [RETURN_KIND]: typeof AsyncReturn } }
	| { provider(): Promise<{ [RETURN_KIND]: typeof AsyncReturn }> }
	| { lazy: true };

export type RequiresAsyncResolver<
	Invariants extends KeyTypeInvariants,
	Providers extends ProviderRegistrations<Invariants>,
	Key extends keyof Invariants,
> = Providers[Key] extends InherentAsyncResolvingService
	? true
	: Providers[Key] extends ProviderInfo<
				ProviderRegistration<any, any, any, infer InjectedKeys>,
				any
		  >
		? {
				[I in keyof Invariants]: I extends {
					[K in keyof InjectedKeys]: InjectedKeys[K];
				}[keyof InjectedKeys]
					? RequiresAsyncResolver<
							Invariants,
							Providers,
							I
						> extends true
						? I
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
