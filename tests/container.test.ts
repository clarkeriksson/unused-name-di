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

test("service container is defined", () => expect(di).toBeDefined());

describe("Transient Service Resolution", () => {
    const resolvedFileService0 = di.resolve("FileService0");

    it("should resolve a transient service to a defined value", () =>
        expect(resolvedFileService0).toBeDefined());

    const anotherResolvedFileService0 = di.resolve("FileService0");

    it("should resolve transient services as a unique instance per resolution", () =>
        expect(resolvedFileService0).not.toBe(anotherResolvedFileService0));

    it("should resolve transient service dependencies", () => {
        expect(resolvedFileService0.date).toBeInstanceOf(DateService);
        expect(resolvedFileService0.image).toBeInstanceOf(ImageService);
        expect(resolvedFileService0.video).toBeInstanceOf(VideoService);
    });
});

describe("Scoped Service Resolution", () => {
    const resolvedImageService = di.resolve("ImageService");

    it("should resolve a scoped service to a defined value", () =>
        expect(resolvedImageService).toBeDefined());

    const anotherResolvedImageService = di.resolve("ImageService");

    it("should resolve scoped services as the same instance per resolution", () =>
        expect(resolvedImageService).toBe(anotherResolvedImageService));

    it("should resolve scoped service dependencies", () => {
        expect(resolvedImageService.pxWidth).toBeTypeOf("number");
        expect(resolvedImageService.video).toBeInstanceOf(VideoService);
    });

    const child = di.child().build();
    const childResolvedImageService = child.resolve("ImageService");

    it("should resolve scoped services as different instances in different containers", () =>
        expect(childResolvedImageService).not.toBe(resolvedImageService));
});

describe("Singleton Service Resolution", () => {
    const resolvedVideoService = di.resolve("VideoService");

    it("should resolve a singleton service to a defined value", () =>
        expect(resolvedVideoService).toBeDefined());

    const anotherResolvedVideoService = di.resolve("VideoService");

    it("should resolve singleton services as the same instance per resolution", () =>
        expect(resolvedVideoService).toBe(anotherResolvedVideoService));

    it("should resolve singleton service dependencies", () => {
        expect(resolvedVideoService.date).toBeInstanceOf(DateService);
    });

    const child = di.child().build();
    const childResolvedVideoService = child.resolve("VideoService");

    it("should resolve scoped services as the same instance in different containers", () =>
        expect(childResolvedVideoService).toBe(resolvedVideoService));
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
        .factory(
            "TestPrimitive",
            context.inject(() => sym),
            "singleton",
        )
        .build();

    const resolvedSym = newScope.resolve("TestPrimitive");
    expect(resolvedSym).toBeDefined();
    expect(resolvedSym).toBe(sym);
});

test("singleton services are identical across containers", () => {
    const child = di.child().build();

    const rootFileService = di.resolve("GlobalConfig");
    const scopedFileService = child.resolve("GlobalConfig");

    expect(rootFileService).toBe(scopedFileService);
});

test("scoped services are different across containers", () => {
    const child = di.child().build();

    const rootImage = di.resolve("ImageService");
    const childImage = child.resolve("ImageService");

    expect(rootImage).not.toBe(childImage);

    const anotherRootImage = di.resolve("ImageService");
    const anotherChildImage = child.resolve("ImageService");

    expect(anotherRootImage).toBe(rootImage);
    expect(anotherChildImage).toBe(childImage);
});

test("non-singleton services can be overriden", () => {
    const child = di
        .child()
        .ctor("ImageService", ImageServiceNew, "scoped")
        .build();

    const image = child.resolve("ImageService");

    expect(image).toBeInstanceOf(ImageServiceNew);
});

test("singleton services cannot be overriden", () => {
    // prettier-ignore
    // @ts-expect-error
    expect(() => di.child().factory("AppId", ctxBuiltWithForKey.inject(() => "NewId"), "scoped")).toThrow();
});

test("singleton services created in child containers cannot be overriden further down the hierarchy", () => {
    const child = di
        .child()
        .ctor("ImageService", ImageServiceNew, "singleton")
        .build();

    const image = child.resolve("ImageService");
    const imageAgain = child.resolve("ImageService");

    expect(image.pxWidth).toBeTypeOf("number");
    expect(image.video).toBeInstanceOf(VideoService);

    expect(image).toBe(imageAgain);

    // prettier-ignore
    // @ts-expect-error
    expect(() => child.child().ctor("ImageService", ImageService, "scoped")).toThrow();

    const otherChild = di
        .child()
        .ctor("ImageService", ImageServiceNew, "transient")
        .build();

    const otherImage = otherChild.resolve("ImageService");
    const otherImageAgain = otherChild.resolve("ImageService");

    expect(image).not.toBe(otherImage);
    expect(otherImage).not.toBe(otherImageAgain);

    // prettier-ignore
    expect(() => otherChild.child().ctor("ImageService", ImageService, "scoped")).not.toThrow();
});
