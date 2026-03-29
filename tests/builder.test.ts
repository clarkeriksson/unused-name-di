/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from "vitest";

import { DI, FileServiceImpl, ImageServiceImpl } from "./setup";

test("container is initialized", () => {
    expect(DI).toBeDefined();
});

test("can resolve transient service correctly", () => {
    const fileService = DI.resolve("FileService0");
    expect(fileService).toBeDefined();
    expect(fileService).toBeInstanceOf(FileServiceImpl);
});

test("transient services are distinct instances", () => {
    const fileService0 = DI.resolve("FileService0");
    expect(fileService0).toBeDefined();
    expect(fileService0).toBeInstanceOf(FileServiceImpl);
    
    const fileService1 = DI.resolve("FileService0");
    expect(fileService1).toBeDefined();
    expect(fileService1).toBeInstanceOf(FileServiceImpl);
    
    expect(fileService0).not.toBe(fileService1);
});

test("can resolve singleton service correctly", () => {
    const imageService = DI.resolve("ImageService");
    expect(imageService).toBeDefined();
    expect(imageService).toBeInstanceOf(ImageServiceImpl);

    const imageServiceAgain = DI.resolve("ImageService");
    expect(imageServiceAgain).toBeDefined();
    expect(imageServiceAgain).toBeInstanceOf(ImageServiceImpl);
});

test("singleton services are the same instance", () => {
    const imageService0 = DI.resolve("ImageService");
    expect(imageService0).toBeDefined();
    expect(imageService0).toBeInstanceOf(ImageServiceImpl);

    const imageService1 = DI.resolve("ImageService");
    expect(imageService1).toBeDefined();
    expect(imageService1).toBeInstanceOf(ImageServiceImpl);

    expect(imageService0).toBe(imageService1);
});