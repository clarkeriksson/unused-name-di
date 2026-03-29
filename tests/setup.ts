import { UnusedName } from "../src/index.js";

function asyncFn(delay?: number) { return new Promise<void>(resolve => setTimeout(() => resolve, delay ?? 0)) }

const builder = UnusedName.builder()
    .singleton("NameService").type<NameService>()
    .transient("DateService").type<DateService>()
    .transient("ChatService").type<ChatService>()
    .singleton("ImageService").type<ImageService>()
    .singleton("VideoService").type<VideoService>()
    .transient("FileService0").type<FileService>()
    .singleton("FileService1").type<FileService>();

export interface NameService {
    chat: ChatService;
    setName(name: string): void;
}

builder.inject(NameServiceFactory)("ChatService");
export function NameServiceFactory(chat: ChatService): NameService {
    return { chat, setName(name: string) { this.chat = chat } }
}

export interface DateService {
    scopeDate(): Date;
}

export class DateServiceImpl implements DateService {
    scopeDate() { return new Date(); }
}
builder.inject(DateServiceImpl)();

export interface ChatService {
    msg(msg: string): Promise<void>;
    login(username: string, password: string): Promise<boolean>;
}

export class ChatServiceImpl implements ChatService {
    static { builder.inject(ChatServiceImpl)("DateService", "FileService1"); }
    private date: DateService;
    async msg(msg: string) { return; }
    async login(username: string, password: string) { await asyncFn(); return true; }
    constructor(date: DateService, file: FileService) {
        this.date = date;
    }
}

export interface ImageService {
    upload(img: string): Promise<boolean>;
    download(file: string): Promise<number[]>;
}

export class ImageServiceImpl implements ImageService {
    async upload(img: string) { await asyncFn(); return true; }
    async download(file: string) { await asyncFn(); return [1, 2, 3]; }
}
builder.inject(ImageServiceImpl)();

export interface VideoService {
    download(videoId: number): Promise<number[]>;
}

export class VideoServiceImpl implements VideoService {
    async download(videoId: number) { await asyncFn(); return [3, 4, 5]; }
}
builder.inject(VideoServiceImpl)();

export interface FileService {
    upload(file: string): Promise<boolean>;
    download(file: string | number): Promise<number[]>;
}

export class FileServiceImpl implements FileService {
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
builder.inject(FileServiceImpl)("ImageService", "VideoService", "DateService");

export class FileServiceImpl2 implements FileService {
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
builder.inject(FileServiceImpl2)("ImageService", "VideoService", "DateService");

export const DI = builder.build([
    NameServiceFactory,
    DateServiceImpl,
    ChatServiceImpl,
    ImageServiceImpl,
    VideoServiceImpl,
    FileServiceImpl,
    FileServiceImpl2
]);