/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from "vitest";

import { DI } from "./container";
import { ChatServiceImpl, FileServiceImpl, GlobalConfig, ImageServiceImpl } from "./setup";

test("container is initialized", () => {
    expect(DI).toBeDefined();
});

test("can resolve transient service correctly", () => {
    const fileService = DI.resolve("FileService0");
    expect(fileService).toBeDefined();
    expect(fileService).toBeInstanceOf(FileServiceImpl);
});

test("can resolve scoped service correctly", () => {
    const imageService = DI.resolve("ImageService");
    expect(imageService).toBeDefined();
    expect(imageService).toBeInstanceOf(ImageServiceImpl);

    const imageServiceAgain = DI.resolve("ImageService");
    expect(imageServiceAgain).toBeDefined();
    expect(imageServiceAgain).toBeInstanceOf(ImageServiceImpl);
});

test("can resolve singleton service correctly", () => {
    const appConfig = DI.resolve("GlobalConfig");
    expect(appConfig).toBeDefined();
    expect(appConfig).toBeInstanceOf(GlobalConfig);

    const appConfigAgain = DI.resolve("GlobalConfig");
    expect(appConfigAgain).toBeDefined();
    expect(appConfigAgain).toBeInstanceOf(GlobalConfig);
});

test ("can resolve primitive service correctly", () => {
    const pixelWidth = DI.resolve("PixelWidth");
    expect(pixelWidth).toBeDefined();
    expect(pixelWidth).toBeTypeOf("number");

    const pixelWidthAgain = DI.resolve("PixelWidth");
    expect(pixelWidthAgain).toBeDefined();
    expect(pixelWidthAgain).toBeTypeOf("number");
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
        .primitive("TestPrimitive").use(sym);

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
})