/* eslint-disable @typescript-eslint/no-unused-vars */
import { it, test, expect, describe } from "vitest";

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

const di = context
	.child()
	.instance("AppId", "AnApp", "singleton")
	.instance("PixelWidth", 16, "singleton")
	.ctor("DateService", DateService, "transient")
	.instance("GlobalConfig", GlobalConfig, "singleton")
	.ctor("VideoService", VideoService, "singleton")
	.ctor("ImageService", ImageService, "scoped")
	.ctor("FileService0", FileService0, "transient")
	.ctor("FileService1", FileService1, "singleton")
	.ctor("ChatService", ChatService, "transient")
	.factory("NameService", NameServiceFactory, "singleton")
	.build();

describe("Container Initialization", () => {
	it("should create a defined container", () => expect(di).toBeDefined());
});

describe("Transient Service Resolution", () => {
	const resolvedFileService0 = di.resolve("FileService0");

	it("should resolve a defined service instance", () =>
		expect(resolvedFileService0).toBeDefined());

	const anotherResolvedFileService0 = di.resolve("FileService0");

	it("should resolve to different instances within a container", () =>
		expect(resolvedFileService0).not.toBe(anotherResolvedFileService0));

	const child = di.scope();
	const childResolvedFileService0 = child.resolve("FileService0");

	it("should resolve to different instances between containers", () =>
		expect(resolvedFileService0).not.toBe(childResolvedFileService0));

	it("should resolve defined service dependencies", () => {
		expect(resolvedFileService0.date).toBeInstanceOf(DateService);
		expect(resolvedFileService0.image).toBeInstanceOf(ImageService);
		expect(resolvedFileService0.video).toBeInstanceOf(VideoService);
	});
});

describe("Scoped Service Resolution", () => {
	const resolvedImageService = di.resolve("ImageService");

	it("should resolve a defined service instance", () =>
		expect(resolvedImageService).toBeDefined());

	const anotherResolvedImageService = di.resolve("ImageService");

	it("should resolve to the same instance within a container", () =>
		expect(resolvedImageService).toBe(anotherResolvedImageService));

	const child = di.scope();
	const childResolvedImageService = child.resolve("ImageService");

	it("should resolve to different instances between containers", () =>
		expect(childResolvedImageService).not.toBe(resolvedImageService));

	it("should resolve defined service dependencies", () => {
		expect(resolvedImageService.pxWidth).toBeTypeOf("number");
		expect(resolvedImageService.video).toBeInstanceOf(VideoService);
	});
});

describe("Singleton Service Resolution", () => {
	const resolvedVideoService = di.resolve("VideoService");

	it("should resolve a defined service instance", () =>
		expect(resolvedVideoService).toBeDefined());

	const anotherResolvedVideoService = di.resolve("VideoService");

	it("should resolve to the same instance within a container", () =>
		expect(resolvedVideoService).toBe(anotherResolvedVideoService));

	const child = di.scope();
	const childResolvedVideoService = child.resolve("VideoService");

	it("should resolve to the same instance between containers", () =>
		expect(childResolvedVideoService).toBe(resolvedVideoService));

	it("should resolve defined service dependencies", () => {
		expect(resolvedVideoService.date).toBeInstanceOf(DateService);
	});
});

test("services registered by implementation alone work", () => {
	const configService = di.resolve("GlobalConfig");
	expect(configService).toBeDefined();
	expect(configService).toBe(GlobalConfig);
});

test("value services work", () => {
	const appIdService = di.resolve("AppId");
	expect(appIdService).toBeDefined();
	expect(appIdService).toBe("AnApp");

	const pixelWidthService = di.resolve("PixelWidth");
	expect(pixelWidthService).toBeDefined();
	expect(pixelWidthService).toBe(16);
});

test("child initializes properly", () => {
	const sym = Symbol();

	const newScope = di
		.child()
		.instance("TestPrimitive", sym, "singleton")
		.build();

	const resolvedSym = newScope.resolve("TestPrimitive");
	expect(resolvedSym).toBeDefined();
	expect(resolvedSym).toBe(sym);
});

test("non-singleton services can be overriden", () => {
	const child = di
		.child()
		.ctor("ImageService", ImageServiceNew, "scoped")
		.build();

	const image = child.resolve("ImageService");

	expect(image).toBeInstanceOf(ImageServiceNew);
});

// Reintroduce singleton override tests, but as type tests for compile-time
