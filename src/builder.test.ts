/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from "vitest";

import { UnusedName } from ".";

function asyncFn(delay?: number) { return new Promise<void>(resolve => setTimeout(() => resolve, delay ?? 0)) }

const builder = UnusedName.builder<{
    DateService: DateService,
    ChatService: ChatService,
    ImageService: ImageService,
    VideoService: VideoService,
    ["FileService.key0"]: FileService,
    ["FileService.key1"]: FileService,
    NameService: NameService
}>();

interface NameService {
    chat: ChatService;
    setName(name: string): void;
}

builder.inject("ImageService")(NameServiceFactory);
function NameServiceFactory(chat: ChatService): NameService {
    return { chat, setName(name: string) { this.chat = chat } }
}

interface DateService {
    scopeDate(): Date;
}

class DateServiceImpl implements DateService {
    scopeDate() { return new Date(); }
}
builder.inject()(DateServiceImpl);

interface ChatService {
    msg(msg: string): Promise<void>;
    login(username: string, password: string): Promise<boolean>;
}

class ChatServiceImpl implements ChatService {
    private date: DateService;
    async msg(msg: string) { return; }
    async login(username: string, password: string) { await asyncFn(); return true; }
    constructor(date: DateService, file: FileService) {
        this.date = date;
    }
}
builder.inject("DateService", "FileService.key1")(ChatServiceImpl);

interface ImageService {
    upload(img: string): Promise<boolean>;
    download(file: string): Promise<number[]>;
}

class ImageServiceImpl implements ImageService {
    async upload(img: string) { await asyncFn(); return true; }
    async download(file: string) { await asyncFn(); return [1, 2, 3]; }
}
builder.inject()(ImageServiceImpl);

interface VideoService {
    download(videoId: number): Promise<number[]>;
}

class VideoServiceImpl implements VideoService {
    async download(videoId: number) { await asyncFn(); return [3, 4, 5]; }
}
builder.inject()(VideoServiceImpl);

interface FileService {
    upload(file: string): Promise<boolean>;
    download(file: string | number): Promise<number[]>;
}

class FileServiceImpl implements FileService {
    private date: DateService;
    private image: ImageService;
    private video: VideoService;
    async upload(file: string) { await asyncFn(); return true; }
    async download(file: string | number) { await asyncFn(); return [6, 7, 8]; }
    constructor(image: ImageService, video: VideoService, date: DateService) {
        this.date = date;
        this.image = image;
        this.video = video;
    }
}
builder.inject("ImageService", "VideoService", "DateService")(FileServiceImpl);

class FileServiceImpl2 implements FileService {
    private date: DateService;
    private image: ImageService;
    private video: VideoService;
    async upload(file: string) { await asyncFn(); return true; }
    async download(file: string | number) { await asyncFn(); return [6, 7, 8]; }
    constructor(image: ImageService, video: VideoService, date: DateService) {
        this.date = date;
        this.image = image;
        this.video = video;
    }
}
builder.inject("ImageService", "VideoService", "DateService")(FileServiceImpl2);

const DI = builder
    .transient("NameService").use<NameService>(NameServiceFactory)
    .transient("DateService").use<DateService>(DateServiceImpl)
    .transient("ChatService").use<ChatService>(ChatServiceImpl)
    .singleton("ImageService").use<ImageService>(ImageServiceImpl)
    .singleton("VideoService").use<VideoService>(VideoServiceImpl)
    .transient("FileService.key0").use<FileService>(FileServiceImpl)
    .transient("FileService.key1").use<FileService>(FileServiceImpl2)
    .build();

test("container is initialized", () => {
    expect(DI).toBeDefined();
});

test("can resolve transient service correctly", () => {
    const fileService = DI.resolve("FileService.key0");
    expect(fileService).toBeDefined();
    expect(fileService).toBeInstanceOf(FileServiceImpl);
});

test("transient services are distinct instances", () => {
    const fileService0 = DI.resolve("FileService.key0");
    expect(fileService0).toBeDefined();
    expect(fileService0).toBeInstanceOf(FileServiceImpl);
    
    const fileService1 = DI.resolve("FileService.key0");
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