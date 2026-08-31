/* eslint-disable @typescript-eslint/no-unused-vars */
import { it, test, expect, describe } from "vitest";
import * as DI from "../src";

import { context } from "./context";
import {
	ChatService,
	DateService,
	FileService0,
	FileService1,
	GlobalConfig,
	ImageService,
	ImageServiceNew,
	NameServiceFactory,
	VideoService,
} from "./setup";

const di = context.child((builder) => {
	return builder
		.instance("AppId", "AnApp", "singleton")
		.instance("PixelWidth", 16, "singleton")
		.ctor("DateService", DateService, "transient")
		.instance("GlobalConfig", GlobalConfig, "singleton")
		.ctor("VideoService", VideoService, "singleton")
		.ctor("ImageService", ImageService, "scoped")
		.ctor("FileService0", FileService0, "transient")
		.ctor("FileService1", FileService1, "singleton")
		.ctor("ChatService", ChatService, "transient")
		.factory("NameService", NameServiceFactory, "singleton");
});

describe("Container Initialization", () => {
	it("should create a defined container", () => expect(di).toBeDefined());
});

describe("Transient Service Resolution", () => {
	interface SERVICE {
		readonly tag: "__TRANSIENT__";
	}
	class SERVICEIMPL implements SERVICE {
		readonly tag = "__TRANSIENT__";
	}

	const context = DI.context<{ SERVICE: SERVICE }>();

	const SERVICE = context.inject(SERVICEIMPL);

	const root = context.child((builder) =>
		builder.ctor("SERVICE", SERVICE, "transient")
	);
	const child = root.scope();

	const rootService0 = root.resolve("SERVICE");
	const childService0 = child.resolve("SERVICE");
	const childService1 = child.resolve("SERVICE");

	it("should resolve a defined service instance", () =>
		expect(rootService0).toBeDefined());
	it("should resolve to different instances within the same container", () =>
		expect(childService0).not.toBe(childService1));
	it("should resolve to different instances between different containers", () =>
		expect(rootService0).not.toBe(childService0));
});

describe("Scoped Service Resolution", () => {
	interface SERVICE {
		readonly tag: "__SCOPED__";
	}
	class SERVICEIMPL implements SERVICE {
		readonly tag = "__SCOPED__";
	}

	const context = DI.context<{ SERVICE: SERVICE }>();

	const SERVICE = context.inject(SERVICEIMPL);

	const root = context.child((builder) =>
		builder.ctor("SERVICE", SERVICE, "scoped")
	);
	const child = root.scope();

	const rootService0 = root.resolve("SERVICE");
	const childService0 = child.resolve("SERVICE");
	const childService1 = child.resolve("SERVICE");

	it("should resolve a defined service instance", () =>
		expect(rootService0).toBeDefined());
	it("should resolve to the same instance within the same container", () =>
		expect(childService0).toBe(childService1));
	it("should resolve to different instances between different containers", () =>
		expect(rootService0).not.toBe(childService0));
});

describe("Singleton Service Resolution", () => {
	interface SERVICE {
		readonly tag: "__SINGLETON__";
	}
	class SERVICEIMPL implements SERVICE {
		readonly tag = "__SINGLETON__";
	}

	const context = DI.context<{ SERVICE: SERVICE }>();

	const SERVICE = context.inject(SERVICEIMPL);

	const root = context.child((builder) =>
		builder.ctor("SERVICE", SERVICE, "singleton")
	);
	const child = root.scope();

	const rootService0 = root.resolve("SERVICE");
	const childService0 = child.resolve("SERVICE");
	const childService1 = child.resolve("SERVICE");

	it("should resolve a defined service instance", () =>
		expect(rootService0).toBeDefined());
	it("should resolve to the same instance within the same container", () =>
		expect(childService0).toBe(childService1));
	it("should resolve to the same instance between different containers", () =>
		expect(rootService0).toBe(childService0));
});

describe("Service Constructor Registration", () => {
	interface SERVICE {
		readonly tag: "__CTOR__";
	}
	class SERVICEIMPL implements SERVICE {
		readonly tag = "__CTOR__";
	}

	const context = DI.context<{
		TRANSIENTSERVICE: SERVICE;
		SCOPEDSERVICE: SERVICE;
		SINGLETONSERVICE: SERVICE;
	}>();

	const SERVICE = context.inject(SERVICEIMPL);

	const container = context.child((builder) =>
		builder
			.ctor("TRANSIENTSERVICE", SERVICE, "transient")
			.ctor("SCOPEDSERVICE", SERVICE, "scoped")
			.ctor("SINGLETONSERVICE", SERVICE, "singleton")
	);

	const transientResolved = container.resolve("TRANSIENTSERVICE");
	const scopedResolved = container.resolve("SCOPEDSERVICE");
	const singletonResolved = container.resolve("SINGLETONSERVICE");

	it("should register and create an instance when transient", () =>
		expect(transientResolved).toBeInstanceOf(SERVICEIMPL));
	it("should register and create an instance when scoped", () =>
		expect(scopedResolved).toBeInstanceOf(SERVICEIMPL));
	it("should register and create an instance when singleton", () =>
		expect(singletonResolved).toBeInstanceOf(SERVICEIMPL));
});

describe("Service Factory Registration", () => {
	interface SERVICE {
		readonly tag: "__FACTORY__";
	}
	function SERVICEFACTORY(): SERVICE {
		return {
			tag: "__FACTORY__",
		};
	}

	const context = DI.context<{
		TRANSIENTSERVICE: SERVICE;
		SCOPEDSERVICE: SERVICE;
		SINGLETONSERVICE: SERVICE;
	}>();

	const SERVICE = context.inject(SERVICEFACTORY);

	const container = context.child((builder) => {
		return builder
			.factory("TRANSIENTSERVICE", SERVICE, "transient")
			.factory("SCOPEDSERVICE", SERVICE, "scoped")
			.factory("SINGLETONSERVICE", SERVICE, "singleton");
	});

	const transientResolved = container.resolve("TRANSIENTSERVICE");
	const scopedResolved = container.resolve("SCOPEDSERVICE");
	const singletonResolved = container.resolve("SINGLETONSERVICE");

	it("should register and create an instance when transient", () =>
		expect(transientResolved).toHaveProperty("tag", "__FACTORY__"));
	it("should register and create an instance when scoped", () =>
		expect(scopedResolved).toHaveProperty("tag", "__FACTORY__"));
	it("should register and create an instance when singleton", () =>
		expect(singletonResolved).toHaveProperty("tag", "__FACTORY__"));
});

describe("Service Instance Registration", () => {
	interface SERVICE {
		readonly tag: "__INSTANCE__";
	}
	const SERVICEINSTANCE = { tag: "__INSTANCE__" as const };

	const context = DI.context<{
		SCOPEDSERVICE: SERVICE;
		SINGLETONSERVICE: SERVICE;
		VALUESERVICE: number;
	}>();

	const VALUESERVICE: number = 113;

	const container = context.child((builder) => {
		return builder
			.instance("SCOPEDSERVICE", SERVICEINSTANCE, "scoped")
			.instance("SINGLETONSERVICE", SERVICEINSTANCE, "singleton")
			.instance("VALUESERVICE", VALUESERVICE, "singleton");
	});

	const scopedResolved = container.resolve("SCOPEDSERVICE");
	const singletonResolved = container.resolve("SINGLETONSERVICE");
	const valueResolved = container.resolve("VALUESERVICE");

	it("should register and create an instance when scoped", () =>
		expect(scopedResolved).toHaveProperty("tag", "__INSTANCE__"));
	it("should register and create an instance when singleton", () =>
		expect(singletonResolved).toHaveProperty("tag", "__INSTANCE__"));
	it("should register and resolve a value service", () =>
		expect(valueResolved).toBe(113));
});

test("services registered by implementation alone work", () => {
	const configService = di.resolve("GlobalConfig");
	expect(configService).toBeDefined();
	expect(configService).toBe(GlobalConfig);
});

test("child initializes properly", () => {
	const sym = Symbol();

	const newScope = di.child((builder) =>
		builder.instance("TestPrimitive", sym, "singleton")
	);

	const resolvedSym = newScope.resolve("TestPrimitive");
	expect(resolvedSym).toBeDefined();
	expect(resolvedSym).toBe(sym);
});

test("non-singleton services can be overriden", () => {
	const child = di.child((builder) =>
		builder.ctor("ImageService", ImageServiceNew, "scoped")
	);

	const image = child.resolve("ImageService");

	expect(image).toBeInstanceOf(ImageServiceNew);
});

test("constructor arg inlining and fallback work for all arg counts", () => {
	const createThrowerOnMiscount = (count: number) => {
		return context.inject((...args: Symbol[]) => {
			if (args.length !== count) throw new Error("MISCOUNT");
			return args.length;
		}, ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"].slice(0, count) as any);
	};

	const createClassThrowerOnMiscount = (count: number) => {
		return context.inject(
			class {
				constructor(...args: Symbol[]) {
					if (args.length !== count) throw new Error("MISCOUNT");
					return count;
				}
			},
			["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"].slice(
				0,
				count
			) as any
		);
	};

	const context = DI.context<{
		A0: Symbol;
		A1: Symbol;
		A2: Symbol;
		A3: Symbol;
		A4: Symbol;
		A5: Symbol;
		A6: Symbol;
		A7: Symbol;
		A8: Symbol;
		A9: Symbol;
		F0: number;
		F1: number;
		F2: number;
		F3: number;
		F4: number;
		F5: number;
		F6: number;
		F7: number;
		F8: number;
		F9: number;
		C0: number;
		C1: number;
		C2: number;
		C3: number;
		C4: number;
		C5: number;
		C6: number;
		C7: number;
		C8: number;
		C9: number;
	}>();

	const container = context.child((builder) =>
		builder
			.instance("A0", Symbol(), "scoped")
			.instance("A1", Symbol(), "singleton")
			.instance("A2", Symbol(), "scoped")
			.instance("A3", Symbol(), "singleton")
			.instance("A4", Symbol(), "scoped")
			.instance("A5", Symbol(), "singleton")
			.instance("A6", Symbol(), "scoped")
			.instance("A7", Symbol(), "singleton")
			.instance("A8", Symbol(), "scoped")
			.instance("A9", Symbol(), "singleton")
			.factory("F0", createThrowerOnMiscount(0) as any, "transient")
			.factory("F1", createThrowerOnMiscount(1) as any, "transient")
			.factory("F2", createThrowerOnMiscount(2) as any, "transient")
			.factory("F3", createThrowerOnMiscount(3) as any, "transient")
			.factory("F4", createThrowerOnMiscount(4) as any, "transient")
			.factory("F5", createThrowerOnMiscount(5) as any, "transient")
			.factory("F6", createThrowerOnMiscount(6) as any, "transient")
			.factory("F7", createThrowerOnMiscount(7) as any, "transient")
			.factory("F8", createThrowerOnMiscount(8) as any, "transient")
			.factory("F9", createThrowerOnMiscount(9) as any, "transient")
			.ctor("C0", createClassThrowerOnMiscount(0) as any, "transient")
			.ctor("C1", createClassThrowerOnMiscount(1) as any, "transient")
			.ctor("C2", createClassThrowerOnMiscount(2) as any, "transient")
			.ctor("C3", createClassThrowerOnMiscount(3) as any, "transient")
			.ctor("C4", createClassThrowerOnMiscount(4) as any, "transient")
			.ctor("C5", createClassThrowerOnMiscount(5) as any, "transient")
			.ctor("C6", createClassThrowerOnMiscount(6) as any, "transient")
			.ctor("C7", createClassThrowerOnMiscount(7) as any, "transient")
			.ctor("C8", createClassThrowerOnMiscount(8) as any, "transient")
			.ctor("C9", createClassThrowerOnMiscount(9) as any, "transient")
	);

	expect(container.resolve("F0")).toBeDefined();
	expect(container.resolve("F1")).toBeDefined();
	expect(container.resolve("F2")).toBeDefined();
	expect(container.resolve("F3")).toBeDefined();
	expect(container.resolve("F4")).toBeDefined();
	expect(container.resolve("F5")).toBeDefined();
	expect(container.resolve("F6")).toBeDefined();
	expect(container.resolve("F7")).toBeDefined();
	expect(container.resolve("F8")).toBeDefined();
	expect(container.resolve("F9")).toBeDefined();
	expect(container.resolve("C0")).toBeDefined();
	expect(container.resolve("C1")).toBeDefined();
	expect(container.resolve("C2")).toBeDefined();
	expect(container.resolve("C3")).toBeDefined();
	expect(container.resolve("C4")).toBeDefined();
	expect(container.resolve("C5")).toBeDefined();
	expect(container.resolve("C6")).toBeDefined();
	expect(container.resolve("C7")).toBeDefined();
	expect(container.resolve("C8")).toBeDefined();
	expect(container.resolve("C9")).toBeDefined();
});

test("isProvider detects providers correctly", () => {
	class TestProviderImpl {
		private readonly brand: Symbol;
		constructor() {
			this.brand = Symbol();
		}
	}

	const context = DI.context<{
		P0: TestProviderImpl;
	}>();

	const TestProvider = context.inject(TestProviderImpl);

	expect(context.isProvider(TestProvider)).toBe(true);
	expect(context.isProvider(Date)).toBe(false);
});

test("readDeps throws when given an unregistered object", () => {
	const context = DI.context<{
		SymbolService: Symbol;
	}>();

	// @ts-expect-error
	expect(() => context.readDeps(Date)).toThrow();
});

// Reintroduce singleton override tests, but as type tests for compile-time
