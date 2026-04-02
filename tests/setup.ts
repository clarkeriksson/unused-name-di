import { DI } from "./container.js";

function asyncFn(delay?: number) { return new Promise<void>(resolve => setTimeout(() => resolve, delay ?? 0)) }

export class GlobalConfig {
    apiKey: string = "keykeykey";
}

export interface NameService {
    chat: ChatService;
    setName(name: string): void;
}

DI.inject(NameServiceFactory)("ChatService");
export function NameServiceFactory(chat: ChatService): NameService {
    return { chat, setName(name: string) { this.chat = chat } }
}

export interface DateService {
    scopeDate(): Date;
}

export class DateServiceImpl implements DateService {
    scopeDate() { return new Date(); }
}
DI.inject(DateServiceImpl)();

export interface ChatService {
    readonly date: DateService;
    readonly file: FileService;
    readonly pxWidth: number;
    msg(msg: string): Promise<void>;
    login(username: string, password: string): Promise<boolean>;
}

export class ChatServiceImpl implements ChatService {
    readonly date: DateService;
    readonly file: FileService;
    readonly pxWidth: number;
    static { DI.inject(this)("DateService", "FileService1", "PixelWidth"); }
    async msg(msg: string) { return; }
    async login(username: string, password: string) { await asyncFn(); return true; }
    constructor(date: DateService, file: FileService, pixelWidth: number) {
        this.date = date;
        this.file = file;
        this.pxWidth = pixelWidth
    }
}

export interface ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
    upload(img: string): Promise<boolean>;
    download(file: string): Promise<number[]>;
}

export class ImageServiceImpl implements ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
    async upload(img: string) { await asyncFn(); return true; }
    async download(file: string) { await asyncFn(); return [1, 2, 3]; }
    constructor(pxWidth: number, video: VideoService) {
        this.pxWidth = pxWidth;
        this.video = video;
    }
}
DI.dec.inject("PixelWidth", "VideoService")(ImageServiceImpl);

export interface VideoService {
    readonly date: DateService;
    download(videoId: number): Promise<number[]>;
}

export class VideoServiceImpl implements VideoService {
    readonly date: DateService;
    async download(videoId: number) { await asyncFn(); return [3, 4, 5]; }
    constructor(date: DateService) {
        this.date = date;
    }
}
DI.inject(VideoServiceImpl)("DateService");

export interface FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
    upload(file: string): Promise<boolean>;
    download(file: string | number): Promise<number[]>;
}

export class FileServiceImpl implements FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
    async upload(file: string) { await asyncFn(); return true; }
    async download(file: string | number) { await asyncFn(); return [6, 7, 8]; }
    constructor(image: ImageService, video: VideoService, date: DateService) {
        this.date = date;
        this.image = image;
        this.video = video;
    }
}
DI.inject(FileServiceImpl)("ImageService", "VideoService", "DateService");

export class FileServiceImpl2 implements FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
    async upload(file: string) { await asyncFn(); return true; }
    async download(file: string | number) { await asyncFn(); return [6, 7, 8]; }
    constructor(image: ImageService, video: VideoService, date: DateService) {
        this.date = date;
        this.image = image;
        this.video = video;
    }
}
DI.inject(FileServiceImpl2)("ImageService", "VideoService", "DateService");