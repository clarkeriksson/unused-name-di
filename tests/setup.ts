import { DI } from "./container.js";

export class GlobalConfig {
    apiKey: string = "keykeykey";
}

export interface NameService {
    chat: ChatService;
}

DI.inject(NameServiceFactory)("ChatService");
export function NameServiceFactory(chat: ChatService): NameService {
    return {
        chat,
    };
}

export interface DateService {
    scopeDate(): Date;
}

export class DateServiceImpl implements DateService {
    scopeDate() {
        return new Date();
    }
}
DI.inject(DateServiceImpl)();

export interface ChatService {
    readonly date: DateService;
    readonly file: FileService;
    readonly pxWidth: number;
}

export class ChatServiceImpl implements ChatService {
    readonly date: DateService;
    readonly file: FileService;
    readonly pxWidth: number;
    static {
        DI.inject(this)("DateService", "FileService1", "PixelWidth");
    }
    constructor(date: DateService, file: FileService, pixelWidth: number) {
        this.date = date;
        this.file = file;
        this.pxWidth = pixelWidth;
    }
}

export interface ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
}

export class ImageServiceImpl implements ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
    constructor(pxWidth: number, video: VideoService) {
        this.pxWidth = pxWidth;
        this.video = video;
    }
}
DI.dec.inject("PixelWidth", "VideoService")(ImageServiceImpl);

export interface VideoService {
    readonly date: DateService;
}

export class VideoServiceImpl implements VideoService {
    readonly date: DateService;
    constructor(date: DateService) {
        this.date = date;
    }
}
DI.inject(VideoServiceImpl)("DateService");

export interface FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
}

export class FileServiceImpl implements FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
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
    constructor(image: ImageService, video: VideoService, date: DateService) {
        this.date = date;
        this.image = image;
        this.video = video;
    }
}
DI.inject(FileServiceImpl2)("ImageService", "VideoService", "DateService");

export class ImageServiceNewImpl implements ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
    static {
        DI.inject(this)("PixelWidth", "VideoService");
    }
    constructor(pxWidth: number, video: VideoService) {
        this.pxWidth = pxWidth;
        this.video = video;
    }
}
