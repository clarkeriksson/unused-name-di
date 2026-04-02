/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from "vitest";

import { DI } from "./container";
import { ChatServiceImpl, DateServiceImpl, FileServiceImpl, GlobalConfig, ImageServiceImpl, VideoServiceImpl } from "./setup";

test("container is initialized", () => {
    expect(DI).toBeDefined();
});

test("can resolve transient service correctly", () => {
    const fileService = DI.resolve("FileService0");
    expect(fileService).toBeInstanceOf(FileServiceImpl);

    const date = fileService.date;
    const image = fileService.image;
    const video = fileService.video;

    expect(date).toBeInstanceOf(DateServiceImpl);

    expect(image).toBeInstanceOf(ImageServiceImpl);

    expect(video).toBeInstanceOf(VideoServiceImpl);

    const fileServiceAgain = DI.resolve("FileService0");
    expect(fileServiceAgain).toBeInstanceOf(FileServiceImpl);
});

test("can resolve scoped service correctly", () => {
    const imageService = DI.resolve("ImageService");
    expect(imageService).toBeInstanceOf(ImageServiceImpl);

    const px = imageService.pxWidth;
    const video = imageService.video;

    expect(px).toBeTypeOf("number");

    expect(video).toBeInstanceOf(VideoServiceImpl);

    const imageServiceAgain = DI.resolve("ImageService");
    expect(imageServiceAgain).toBeInstanceOf(ImageServiceImpl);
});

test("can resolve singleton service correctly", () => {
    const video = DI.resolve("VideoService");
    expect(video).toBeInstanceOf(VideoServiceImpl);

    const date = video.date;

    expect(date).toBeInstanceOf(DateServiceImpl);

    const videoAgain = DI.resolve("VideoService");
    expect(videoAgain).toBeInstanceOf(VideoServiceImpl);
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

test("services injected in static blocks work", () => {
    const chatService = DI.resolve("ChatService");
    expect(chatService).toBeDefined();
    expect(chatService).toBeInstanceOf(ChatServiceImpl);
});

test("services registered by implementation alone work", () => {
    const configService = DI.resolve("GlobalConfig");
    expect(configService).toBeDefined();
    expect(configService).toBeInstanceOf(GlobalConfig)
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
        .singleton("TestPrimitive").use(() => () => sym);

    const resolvedSym = newScope.resolve("TestPrimitive");
    expect(resolvedSym).toBeDefined();
    expect(resolvedSym).toBe(sym);
});

test("singleton services are identical across containers", () => {
    const child = DI.child();

    const rootFileService = DI.resolve("GlobalConfig");
    const scopedFileService = child.resolve("GlobalConfig");

    expect(rootFileService).toBe(scopedFileService);
});

test("scoped services are different across containers", () => {
    const child = DI.child();

    const rootImage = DI.resolve("ImageService");
    const childImage = child.resolve("ImageService");

    expect(rootImage).not.toBe(childImage);
    
    const anotherRootImage = DI.resolve("ImageService");
    const anotherChildImage = child.resolve("ImageService");

    expect(anotherRootImage).toBe(rootImage);
    expect(anotherChildImage).toBe(childImage);
});