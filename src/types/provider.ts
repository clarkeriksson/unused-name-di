import { INJECTED, PROVIDER, ProviderKind, ProviderScope } from "./const";
import { KeyTupleForTypeTuple, KeyTypeInvariants } from "./context";

export type Constructor<T, A extends readonly any[]> = new (...args: A) => T;
export type ConstructorArgs<T> = T extends Constructor<any, infer A>
	? A
	: never;
export type ConstructorReturn<T> = T extends Constructor<infer R, any>
	? R
	: never;

export type Factory<T, A extends readonly any[]> = (...args: A) => T;
export type FactoryArgs<T> = T extends Factory<any, infer A> ? A : never;
export type FactoryReturn<T> = T extends Factory<infer R, any> ? R : never;

export type Provider<T, A extends readonly any[]> =
	| Constructor<T, A>
	| Factory<T, A>;
export type ProviderArgs<T> = T extends Provider<any, infer A> ? A : never;
export type ProviderReturn<T> = T extends Provider<infer R, any> ? R : never;

class ClassProvider {
	#name: string;
	#age: number;
	#bday: Date;
	constructor(name: string, age: number, bday: Date) {
		this.#name = name;
		this.#age = age;
		this.#bday = bday;
	}
	print() {
		return `${this.#name}, ${this.#age}, ${this.#bday}`;
	}
}

function FactoryProvider(name: string, age: number, bday: Date) {
	return {
		print() {
			return `${name}, ${age}, ${bday}`;
		},
	};
}

export type ProviderTag<
	Invariants extends KeyTypeInvariants,
	Args extends readonly (keyof Invariants)[]
> = {
	readonly [INJECTED]: Args;
	readonly [PROVIDER]: true;
};

export type ProviderWithArgKeys<
	TargetProvider extends Provider<any, any>,
	Invariants extends KeyTypeInvariants,
	InjectedKeys extends (keyof Invariants)[] & {
		[K in keyof ProviderArgs<TargetProvider>]: {
			[P in keyof Invariants]: ProviderArgs<TargetProvider>[K] extends Invariants[P]
				? P
				: never;
		}[keyof Invariants];
	}
> = TargetProvider & ProviderTag<Invariants, InjectedKeys>;

// export type ProviderWithArgKeys<
// 	TargetProvider extends Provider = Provider,
// 	Invariants extends KeyTypeInvariants = KeyTypeInvariants,
// 	Args extends KeyTupleForTypeTuple<
// 		ProviderArgs<TargetProvider>,
// 		Invariants
// 	> = KeyTupleForTypeTuple<ProviderArgs<TargetProvider>, Invariants>
// > = TargetProvider & ProviderTag<Invariants, Args>;

export type ArgKeysFromTaggedProvider<TaggedProvider> =
	TaggedProvider extends ProviderWithArgKeys<any, any, infer Args>
		? Args extends readonly PropertyKey[]
			? Args
			: never
		: never;

export type ProviderRegistrationOptions<
	Scope extends ProviderScope,
	Async extends boolean = false,
	Lazy extends boolean = false
> = {
	scope: Scope;
	async?: Async;
	lazy?: Lazy;
};

export type ProviderInfo<
	T = any,
	Invariants extends KeyTypeInvariants = KeyTypeInvariants,
	InjectedKeys extends readonly (keyof Invariants)[] = (keyof Invariants)[],
	Scope extends ProviderScope = ProviderScope,
	LazyImport extends boolean = false,
	ReturnsPromise extends boolean = false
> = {
	readonly lazyImport: LazyImport;
	readonly returnsPromise: ReturnsPromise;
	readonly scope: Scope;
} & (
	| {
			readonly lazyImport: false;
			readonly returnsPromise: false;
			provider: Provider<
				T,
				{ [K in keyof InjectedKeys]: Invariants[InjectedKeys[K]] }
			> &
				ProviderTag<Invariants, InjectedKeys>;
	  }
	| {
			readonly lazyImport: true;
			readonly returnsPromise: false;
			readonly importProvider: () => Promise<
				Provider<
					T,
					{ [K in keyof InjectedKeys]: Invariants[InjectedKeys[K]] }
				> &
					ProviderTag<Invariants, InjectedKeys>
			>;
			provider:
				| (Provider<
						T,
						{
							[K in keyof InjectedKeys]: Invariants[InjectedKeys[K]];
						}
				  > &
						ProviderTag<Invariants, InjectedKeys>)
				| null;
	  }
	| {
			readonly lazyImport: false;
			readonly returnsPromise: true;
			provider: Provider<
				T,
				{ [K in keyof InjectedKeys]: Invariants[InjectedKeys[K]] }
			> &
				ProviderTag<Invariants, InjectedKeys>;
	  }
	| {
			readonly lazyImport: true;
			readonly returnsPromise: true;
			readonly importProvider: () => Promise<
				Provider<
					T,
					{ [K in keyof InjectedKeys]: Invariants[InjectedKeys[K]] }
				> &
					ProviderTag<Invariants, InjectedKeys>
			>;
			provider:
				| (Provider<
						T,
						{
							[K in keyof InjectedKeys]: Invariants[InjectedKeys[K]];
						}
				  > &
						ProviderTag<Invariants, InjectedKeys>)
				| null;
	  }
);
