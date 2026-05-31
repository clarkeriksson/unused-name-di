import { context } from "./context";
export interface GlobalConfig {
    apiKey: string;
}

export const GlobalConfig = {
    apiKey: "keykeykey",
};

export interface NameService {
    chat: ChatService;
}

export const NameServiceFactory = context.inject(
    (chat: ChatService): NameService => {
        return { chat };
    },
    ["ChatService"],
);

export interface DateService {
    scopeDate(): Date;
}

class DateServiceImpl implements DateService {
    scopeDate() {
        return new Date();
    }
}

export const DateService = context.inject(DateServiceImpl);

export interface ChatService {
    readonly date: DateService;
    readonly file: FileService;
    readonly pxWidth: number;
}

class ChatServiceImpl implements ChatService {
    readonly date: DateService;
    readonly file: FileService;
    readonly pxWidth: number;
    constructor(date: DateService, file: FileService, pixelWidth: number) {
        this.date = date;
        this.file = file;
        this.pxWidth = pixelWidth;
    }
}

export const ChatService = context.inject(ChatServiceImpl, [
    "DateService",
    "FileService1",
    "PixelWidth",
]);

export interface ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
}

class ImageServiceImpl implements ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
    constructor(pxWidth: number, video: VideoService) {
        this.pxWidth = pxWidth;
        this.video = video;
    }
}

export const ImageService = context.inject(ImageServiceImpl, [
    "PixelWidth",
    "VideoService",
]);

export interface VideoService {
    readonly date: DateService;
}

class VideoServiceImpl implements VideoService {
    readonly date: DateService;
    constructor(date: DateService) {
        this.date = date;
    }
}

export const VideoService = context.inject(VideoServiceImpl, ["DateService"]);

export interface FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
}

class FileService0Impl implements FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
    constructor(image: ImageService, video: VideoService, date: DateService) {
        this.date = date;
        this.image = image;
        this.video = video;
    }
}

export const FileService0 = context.inject(FileService0Impl, [
    "ImageService",
    "VideoService",
    "DateService",
]);

class FileService1Impl implements FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
    constructor(image: ImageService, video: VideoService, date: DateService) {
        this.date = date;
        this.image = image;
        this.video = video;
    }
}

export const FileService1 = context.inject(FileService1Impl, [
    "ImageService",
    "VideoService",
    "DateService",
]);

class ImageServiceNewImpl implements ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
    constructor(pxWidth: number, video: VideoService) {
        this.pxWidth = pxWidth;
        this.video = video;
    }
}

export const ImageServiceNew = context.inject(ImageServiceNewImpl, [
    "PixelWidth",
    "VideoService",
]);
