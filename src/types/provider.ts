import {
	Injected,
	ProviderKind,
	ProviderScopeKey,
	Async,
	ProviderKindKey,
} from "./const";
import { KeyTupleForTypeTuple, KeyTypeInvariants } from "./context";

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

export type TaggedProvider<
	Invariants extends KeyTypeInvariants,
	Service extends Invariants[keyof Invariants],
	Arguments extends readonly Invariants[keyof Invariants][],
	InjectedKeys extends {
		[K in keyof Arguments]: {
			[P in keyof Invariants]: Arguments[K] extends Invariants[P]
				? P
				: never;
		}[keyof Invariants];
	},
	Async extends boolean,
> = Provider<Async extends true ? Promise<Service> : Service, Arguments> & {
	readonly [Injected]: InjectedKeys;
	readonly [Async]: Async;
	readonly [ProviderKind]: ProviderKindKey;
};

// export type ProviderWithArgKeys<
// 	TargetProvider extends Provider = Provider,
// 	Invariants extends KeyTypeInvariants = KeyTypeInvariants,
// 	Args extends KeyTupleForTypeTuple<
// 		ProviderArgs<TargetProvider>,
// 		Invariants
// 	> = KeyTupleForTypeTuple<ProviderArgs<TargetProvider>, Invariants>
// > = TargetProvider & ProviderTag<Invariants, Args>;

export type ProviderRegistrationOptions<
	Scope extends ProviderScopeKey,
	Async extends boolean = false,
	Lazy extends boolean = false,
> = {
	scope: Scope;
	async?: Async;
	lazy?: Lazy;
};

export type ProviderInfo<
	Service extends Invariants[keyof Invariants],
	Arguments extends readonly Invariants[keyof Invariants][],
	Invariants extends KeyTypeInvariants,
	InjectedKeys extends {
		[K in keyof Arguments]: {
			[P in keyof Invariants]: Arguments[K] extends Invariants[P]
				? P
				: never;
		}[keyof Invariants];
	},
	Scope extends ProviderScopeKey,
	Async extends boolean,
	Lazy extends boolean,
> = {
	provider: TaggedProvider<
		Invariants,
		Service,
		Arguments,
		InjectedKeys,
		Async
	>;
	readonly scope: Scope;
} & (Lazy extends true
	? {
			importProvider: () => Promise<
				TaggedProvider<
					Invariants,
					Service,
					Arguments,
					InjectedKeys,
					Async
				>
			>;
		}
	: {});
