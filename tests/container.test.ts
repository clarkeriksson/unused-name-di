/* eslint-disable @typescript-eslint/no-unused-vars */
import { it, test, expect, describe } from "vitest";
import * as DI from "../src";

import {
	ChatService,
	DateService,
	FileService0,
	FileService1,
	GlobalConfig,
	ImageService,
	ImageServiceNew,
	NameServiceFactory,
	PixelWidth,
	VideoService,
	VideoServicePromise,
} from "./setup";
import { AppInvariants } from "./context";
import { KeysOfScope } from "../src/global";
import { DependencyContainer } from "../src/container";

const info = {
	provider: null,
	async runtimeProvider() {
		this.provider = (await import("./setup")).ChatService as any;
	},
};

const di = DI.root<AppInvariants>().child((builder) => {
	return builder
		.add("DateService", DateService, "transient")
		.add("PixelWidth", PixelWidth, "singleton")
		.addAwaited("VideoService", VideoServicePromise, "transient")
		.add("ImageService", ImageService, "scoped")
		.addLazyAwaited("FileService1", async () => FileService1, "singleton")
		.add("ChatService", ChatService, "scoped")
		.addAwaited("NameService", NameServiceFactory, "transient")
		.add("FileService0", FileService0, "transient");
});

const dateService = di.resolve("DateService");
describe("correct sync resolution", () => {
	it("should not be a promise", () =>
		expect(di.resolve("DateService")).not.toBeInstanceOf(Promise));
});
const pixelWidthService = di.resolve("PixelWidth");
const videoService = di.resolve("VideoService");
describe("correct async resolution", () => {
	it("should be a promise", () =>
		expect(di.resolve("VideoService")).toBeInstanceOf(Promise));
});
const imageService = di.resolve("ImageService");
const chatService = di.resolve("ChatService");
const nameService = await di.resolve("NameService");
const fileService0 = di.resolve("FileService0");
const fileService1 = di.resolve("FileService1");

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

	type TestInvariants = { SERVICE: SERVICE };

	const inject = DI.injector<TestInvariants>();

	const SERVICE = inject.ctor(SERVICEIMPL);

	const root = DI.root<TestInvariants>().child((builder) =>
		builder.add("SERVICE", SERVICE, "transient"),
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

	type TestInvariants = { SERVICE: SERVICE };

	const inject = DI.injector<{ SERVICE: SERVICE }>();

	const SERVICE = inject.ctor(SERVICEIMPL);

	const root = DI.root<TestInvariants>().child((builder) =>
		builder.add("SERVICE", SERVICE, "scoped"),
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

	type TestInvariants = { SERVICE: SERVICE };

	const inject = DI.injector<TestInvariants>();

	const SERVICE = inject.ctor(SERVICEIMPL);

	const root = DI.root<TestInvariants>().child((builder) =>
		builder.add("SERVICE", SERVICE, "singleton"),
	);
	const child = root.scope();

	it("should not be the same container", () => expect(root).not.toBe(child));

	const rootService0 = root.resolve("SERVICE");
	console.log("resolving root singleton");
	const childService0 = child.resolve("SERVICE");
	console.log("resolving child singleton first time");
	const childService1 = child.resolve("SERVICE");
	console.log("resolving child singleton the second time");

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

	type TestInvariants = {
		TRANSIENTSERVICE: SERVICE;
		SCOPEDSERVICE: SERVICE;
		SINGLETONSERVICE: SERVICE;
	};

	const inject = DI.injector<TestInvariants>();

	const SERVICE = inject.ctor(SERVICEIMPL);

	const container = DI.root<TestInvariants>().child((builder) =>
		builder
			.add("TRANSIENTSERVICE", SERVICE, "transient")
			.add("SCOPEDSERVICE", SERVICE, "scoped")
			.add("SINGLETONSERVICE", SERVICE, "singleton"),
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

describe("Service Factory Registration", async () => {
	interface SERVICE {
		readonly tag: "__FACTORY__";
	}
	function SERVICEFACTORY(): SERVICE {
		return {
			tag: "__FACTORY__",
		};
	}
	async function ASYNCSERVICEFACTORY(): Promise<SERVICE> {
		return {
			tag: "__FACTORY__",
		};
	}

	type TestInvariants = {
		TRANSIENTSERVICE: SERVICE;
		SCOPEDSERVICE: SERVICE;
		SINGLETONSERVICE: SERVICE;
	};

	const inject = DI.injector<TestInvariants>();

	const SERVICE = inject.factory(SERVICEFACTORY);
	const ASYNCSERVICE = inject.factory(ASYNCSERVICEFACTORY);

	const container = DI.root<TestInvariants>().child((builder) => {
		return builder
			.addLazyAwaited("SCOPEDSERVICE", async () => SERVICE, "scoped")
			.addAwaited("TRANSIENTSERVICE", ASYNCSERVICE, "transient")
			.add("SINGLETONSERVICE", SERVICE, "singleton");
	});

	const transientResolved = await container.resolve("TRANSIENTSERVICE");
	const scopedResolved = await container.resolve("SCOPEDSERVICE");
	const singletonResolved = container.resolve("SINGLETONSERVICE");

	it("should register and create an instance when transient", () =>
		expect(transientResolved).toHaveProperty("tag", "__FACTORY__"));
	it("should register and create an instance when scoped", () =>
		expect(scopedResolved).toHaveProperty("tag", "__FACTORY__"));
	it("should register and create an instance when singleton", () =>
		expect(singletonResolved).toHaveProperty("tag", "__FACTORY__"));
});

test("child initializes properly", () => {
	const sym = Symbol();

	const inject = DI.injector<AppInvariants>();

	const newScope = di.child((builder) =>
		builder.add("TestPrimitive", inject.instance(sym), "singleton"),
	);

	const resolvedSym = newScope.resolve("TestPrimitive");
	expect(resolvedSym).toBeDefined();
	expect(resolvedSym).toBe(sym);
});

test("non-singleton services can be overriden", async () => {
	const child = di.child((builder) =>
		builder.add("ImageService", ImageServiceNew, "scoped"),
	);

	const image = await child.resolve("ImageService");

	expect(image).toBeInstanceOf(ImageServiceNew);
});

// test("constructor arg inlining and fallback work for all arg counts", () => {
// 	const createThrowerOnMiscount = (count: number) => {
// 		return context.inject((...args: Symbol[]) => {
// 			if (args.filter(Boolean).length !== count)
// 				throw new Error("MISCOUNT");
// 			return args.length;
// 		}, ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"].slice(0, count) as any);
// 	};

// 	const createClassThrowerOnMiscount = (count: number) => {
// 		return context.inject(
// 			class {
// 				constructor(...args: Symbol[]) {
// 					if (args.filter(Boolean).length !== count)
// 						throw new Error("MISCOUNT");
// 					return count;
// 				}
// 			},
// 			["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"].slice(
// 				0,
// 				count
// 			) as any
// 		);
// 	};

// 	const context = DI.context<{
// 		A0: Symbol;
// 		A1: Symbol;
// 		A2: Symbol;
// 		A3: Symbol;
// 		A4: Symbol;
// 		A5: Symbol;
// 		A6: Symbol;
// 		A7: Symbol;
// 		A8: Symbol;
// 		A9: Symbol;
// 		F0: number;
// 		F1: number;
// 		F2: number;
// 		F3: number;
// 		F4: number;
// 		F5: number;
// 		F6: number;
// 		F7: number;
// 		F8: number;
// 		F9: number;
// 		C0: number;
// 		C1: number;
// 		C2: number;
// 		C3: number;
// 		C4: number;
// 		C5: number;
// 		C6: number;
// 		C7: number;
// 		C8: number;
// 		C9: number;
// 	}>();

// 	const container = context.child((builder) =>
// 		builder
// 			.instance("A0", Symbol(), "scoped")
// 			.instance("A1", Symbol(), "singleton")
// 			.instance("A2", Symbol(), "scoped")
// 			.instance("A3", Symbol(), "singleton")
// 			.instance("A4", Symbol(), "scoped")
// 			.instance("A5", Symbol(), "singleton")
// 			.instance("A6", Symbol(), "scoped")
// 			.instance("A7", Symbol(), "singleton")
// 			.instance("A8", Symbol(), "scoped")
// 			.instance("A9", Symbol(), "singleton")
// 			.factory("F0", createThrowerOnMiscount(0) as any, "transient")
// 			.factory("F1", createThrowerOnMiscount(1) as any, "transient")
// 			.factory("F2", createThrowerOnMiscount(2) as any, "transient")
// 			.factory("F3", createThrowerOnMiscount(3) as any, "transient")
// 			.factory("F4", createThrowerOnMiscount(4) as any, "transient")
// 			.factory("F5", createThrowerOnMiscount(5) as any, "transient")
// 			.factory("F6", createThrowerOnMiscount(6) as any, "transient")
// 			.factory("F7", createThrowerOnMiscount(7) as any, "transient")
// 			.factory("F8", createThrowerOnMiscount(8) as any, "transient")
// 			.factory("F9", createThrowerOnMiscount(9) as any, "transient")
// 			.ctor("C0", createClassThrowerOnMiscount(0) as any, "transient")
// 			.ctor("C1", createClassThrowerOnMiscount(1) as any, "transient")
// 			.ctor("C2", createClassThrowerOnMiscount(2) as any, "transient")
// 			.ctor("C3", createClassThrowerOnMiscount(3) as any, "transient")
// 			.ctor("C4", createClassThrowerOnMiscount(4) as any, "transient")
// 			.ctor("C5", createClassThrowerOnMiscount(5) as any, "transient")
// 			.ctor("C6", createClassThrowerOnMiscount(6) as any, "transient")
// 			.ctor("C7", createClassThrowerOnMiscount(7) as any, "transient")
// 			.ctor("C8", createClassThrowerOnMiscount(8) as any, "transient")
// 			.ctor("C9", createClassThrowerOnMiscount(9) as any, "transient")
// 	);

// 	expect(container.resolve("F0")).toBeDefined();
// 	expect(container.resolve("F1")).toBeDefined();
// 	expect(container.resolve("F2")).toBeDefined();
// 	expect(container.resolve("F3")).toBeDefined();
// 	expect(container.resolve("F4")).toBeDefined();
// 	expect(container.resolve("F5")).toBeDefined();
// 	expect(container.resolve("F6")).toBeDefined();
// 	expect(container.resolve("F7")).toBeDefined();
// 	expect(container.resolve("F8")).toBeDefined();
// 	expect(container.resolve("F9")).toBeDefined();
// 	expect(container.resolve("C0")).toBeDefined();
// 	expect(container.resolve("C1")).toBeDefined();
// 	expect(container.resolve("C2")).toBeDefined();
// 	expect(container.resolve("C3")).toBeDefined();
// 	expect(container.resolve("C4")).toBeDefined();
// 	expect(container.resolve("C5")).toBeDefined();
// 	expect(container.resolve("C6")).toBeDefined();
// 	expect(container.resolve("C7")).toBeDefined();
// 	expect(container.resolve("C8")).toBeDefined();
// 	expect(container.resolve("C9")).toBeDefined();
// });
