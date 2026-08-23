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
		builder.ctor("SERVICE", SERVICE, "transient"),
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
		builder.ctor("SERVICE", SERVICE, "scoped"),
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
		builder.ctor("SERVICE", SERVICE, "singleton"),
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
			.ctor("SINGLETONSERVICE", SERVICE, "singleton"),
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
		builder.instance("TestPrimitive", sym, "singleton"),
	);

	const resolvedSym = newScope.resolve("TestPrimitive");
	expect(resolvedSym).toBeDefined();
	expect(resolvedSym).toBe(sym);
});

test("non-singleton services can be overriden", () => {
	const child = di.child((builder) =>
		builder.ctor("ImageService", ImageServiceNew, "scoped"),
	);

	const image = child.resolve("ImageService");

	expect(image).toBeInstanceOf(ImageServiceNew);
});

// Reintroduce singleton override tests, but as type tests for compile-time
