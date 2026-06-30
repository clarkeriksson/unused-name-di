import { INJECTED, PROVIDER } from "./const";
import {
	ServiceContainerBuilder,
	ServiceContainerBuilderImpl,
} from "./container";
import { KeyReuseError, UnusedNameError } from "./errors";
import {
	Ctor,
	CtorArgs,
	Creator,
	CreatorArgs,
	Factory,
	FactoryArgs,
	KeysForValueTuple,
	NewKey,
	Pretty,
	InstanceRecord,
	ProviderTag,
} from "./global";

export interface ServiceContextBuilder<S extends InstanceRecord = {}> {
	service<const T>(): <const K extends PropertyKey>(
		key: NewKey<K, S>
	) => ServiceContextBuilder<Pretty<S & { [Key in K]: T }>>;

	build(): ServiceContext<Pretty<S>>;
}

export class ServiceContextBuilderImpl<S extends InstanceRecord = {}>
	implements ServiceContextBuilder<S>
{
	_keys: Set<PropertyKey>;

	constructor() {
		this._keys = new Set();
	}

	service<const T>(): <const K extends PropertyKey>(
		key: NewKey<K, S>
	) => ServiceContextBuilder<Pretty<S & { [Key in K]: T }>> {
		return <const K extends PropertyKey>(key: NewKey<K, S>) => {
			if (this._keys.has(key)) {
				throw new KeyReuseError(key);
			}
			this._keys.add(key);
			return this as ServiceContextBuilder<Pretty<S & { [Key in K]: T }>>;
		};
	}

	build(): ServiceContext<Pretty<S>> {
		const keys = new Set(this._keys);
		return new ServiceContextImpl<Pretty<S>>(keys);
	}
}

export interface ServiceContext<S extends InstanceRecord = {}> {
	inject<
		const C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>
	>(
		provider: C,
		...args: CreatorArgs<C> extends [] ? [args?: A] : [args: A]
	): C & ProviderTag<A>;

	child(): ServiceContainerBuilder<S>;

	isProvider<
		C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>
	>(
		value: C
	): value is C & ProviderTag<A>;
}

export class ServiceContextImpl<S extends InstanceRecord = {}>
	implements ServiceContext<S>
{
	_keys: Set<PropertyKey>;
	_args: Map<Creator, PropertyKey[]>;

	constructor(keys: Set<PropertyKey>) {
		this._keys = keys;
		this._args = new Map();
	}

	inject<
		const C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>
	>(
		provider: C,
		...args: CreatorArgs<C> extends [] ? [args?: A] : [args: A]
	): C & ProviderTag<A> {
		const argArr = (args[0] as A) ?? [];
		this._args.set(provider, argArr);
		return Object.assign(provider, {
			[INJECTED]: argArr,
			[PROVIDER]: true as const,
		});
	}

	child(): ServiceContainerBuilder<S> {
		return new ServiceContainerBuilderImpl(this, {});
	}

	isProvider<
		C extends Creator,
		const A extends KeysForValueTuple<S, CreatorArgs<C>>
	>(value: C): value is C & ProviderTag<A> {
		if (!(PROVIDER in value)) return false;
		const args = this._args.get(value);
		if (!args) return false;
		return (
			INJECTED in value &&
			args.every((v, i) => v === (value[INJECTED] as any[])[i])
		);
	}
}

export type CtorWithArgKeys<
	Provider extends Ctor = Ctor,
	Context extends InstanceRecord = any,
	Args extends KeysForValueTuple<Context, CtorArgs<Provider>> = any
> = Provider & ProviderTag<Args>;

export type FactoryWithArgKeys<
	Provider extends Factory = Factory,
	Context extends InstanceRecord = any,
	Args extends KeysForValueTuple<Context, FactoryArgs<Provider>> = any
> = Provider & ProviderTag<Args>;

export type ProviderWithArgKeys<
	Provider extends Creator = Creator,
	Context extends InstanceRecord = any,
	Args extends KeysForValueTuple<Context, CreatorArgs<Provider>> = any
> = Provider & ProviderTag<Args>;
