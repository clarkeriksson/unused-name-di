/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect, beforeAll } from "vitest";

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

const DI = context
    .child()
    .factory(
        "AppId",
        context.inject(() => "AnApp", []),
        "singleton",
    )
    .factory(
        "PixelWidth",
        context.inject(() => 16, []),
        "singleton",
    )
    .ctor("DateService", DateService, "transient")
    .ctor("GlobalConfig", GlobalConfig, "singleton")
    .ctor("VideoService", VideoService, "singleton")
    .ctor("ImageService", ImageService, "scoped")
    .ctor("FileService0", FileService0, "transient")
    .ctor("FileService1", FileService1, "singleton")
    .ctor("ChatService", ChatService, "transient")
    .factory("NameService", NameServiceFactory, "singleton")
    .build();

test("container is initialized", () => {
    expect(DI).toBeDefined();
});

test("can resolve transient service correctly", () => {
    const fileService = DI.resolve("FileService0");
    expect(fileService).toBeInstanceOf(FileService0);

    const date = fileService.date;
    const image = fileService.image;
    const video = fileService.video;

    expect(date).toBeInstanceOf(DateService);

    expect(image).toBeInstanceOf(ImageService);

    expect(video).toBeInstanceOf(VideoService);

    const fileServiceAgain = DI.resolve("FileService0");
    expect(fileServiceAgain).toBeInstanceOf(FileService0);
});

test("can resolve scoped service correctly", () => {
    const imageService = DI.resolve("ImageService");
    expect(imageService).toBeInstanceOf(ImageService);

    const px = imageService.pxWidth;
    const video = imageService.video;

    expect(px).toBeTypeOf("number");

    expect(video).toBeInstanceOf(VideoService);

    const imageServiceAgain = DI.resolve("ImageService");
    expect(imageServiceAgain).toBeInstanceOf(ImageService);
});

test("can resolve singleton service correctly", () => {
    const video = DI.resolve("VideoService");
    expect(video).toBeInstanceOf(VideoService);

    const date = video.date;

    expect(date).toBeInstanceOf(DateService);

    const videoAgain = DI.resolve("VideoService");
    expect(videoAgain).toBeInstanceOf(VideoService);
});

test("transient services are distinct instances", () => {
    const fileService0 = DI.resolve("FileService0");
    const fileService1 = DI.resolve("FileService0");

    expect(fileService0).not.toBe(fileService1);
});

test("scoped services are the same instance in a container", () => {
    const imageService0 = DI.resolve("ImageService");
    const imageService1 = DI.resolve("ImageService");

    expect(imageService0).toBe(imageService1);
});

test("singleton services are the same in a container", () => {
    const appConfig0 = DI.resolve("GlobalConfig");
    const appConfig1 = DI.resolve("GlobalConfig");

    expect(appConfig0).toBe(appConfig1);
});

test("services registered by implementation alone work", () => {
    const configService = DI.resolve("GlobalConfig");
    expect(configService).toBeDefined();
    expect(configService).toBeInstanceOf(GlobalConfig);
});

test("value services work", () => {
    const appIdService = DI.resolve("AppId");
    expect(appIdService).toBeDefined();
    expect(appIdService).toBe("AnApp");

    const pixelWidthService = DI.resolve("PixelWidth");
    expect(pixelWidthService).toBeDefined();
    expect(pixelWidthService).toBe(16);
});

test("child initializes properly", () => {
    const sym = Symbol();

    const newScope = DI.child()
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
    const child = DI.child().build();

    const rootFileService = DI.resolve("GlobalConfig");
    const scopedFileService = child.resolve("GlobalConfig");

    expect(rootFileService).toBe(scopedFileService);
});

test("scoped services are different across containers", () => {
    const child = DI.child().build();

    const rootImage = DI.resolve("ImageService");
    const childImage = child.resolve("ImageService");

    expect(rootImage).not.toBe(childImage);

    const anotherRootImage = DI.resolve("ImageService");
    const anotherChildImage = child.resolve("ImageService");

    expect(anotherRootImage).toBe(rootImage);
    expect(anotherChildImage).toBe(childImage);
});

test("non-singleton services can be overriden", () => {
    const child = DI.child()
        .ctor("ImageService", ImageServiceNew, "scoped")
        .build();

    const image = child.resolve("ImageService");

    expect(image).toBeInstanceOf(ImageServiceNew);
});

test("singleton services cannot be overriden", () => {
    // prettier-ignore
    // @ts-expect-error
    expect(() => DI.child().factory("AppId", context.inject(() => "NewId"), "scoped")).toThrow();
});

test("singleton services created in child containers cannot be overriden further down the hierarchy", () => {
    const child = DI.child()
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

    const otherChild = DI.child()
        .ctor("ImageService", ImageServiceNew, "transient")
        .build();

    const otherImage = otherChild.resolve("ImageService");
    const otherImageAgain = otherChild.resolve("ImageService");

    expect(image).not.toBe(otherImage);
    expect(otherImage).not.toBe(otherImageAgain);

    // prettier-ignore
    expect(() => otherChild.child().ctor("ImageService", ImageService, "scoped")).not.toThrow();
});
