import { context } from "./context";

export interface GlobalConfig {
    apiKey: string;
}

export const GlobalConfig = context.inject(
    class {
        apiKey: string = "keykeykey";
    },
    [],
);

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

export const DateService = context.inject(
    class {
        scopeDate() {
            return new Date();
        }
    },
    [],
);

export interface ChatService {
    readonly date: DateService;
    readonly file: FileService;
    readonly pxWidth: number;
}

export const ChatService = context.inject(
    class {
        readonly date: DateService;
        readonly file: FileService;
        readonly pxWidth: number;
        constructor(date: DateService, file: FileService, pixelWidth: number) {
            this.date = date;
            this.file = file;
            this.pxWidth = pixelWidth;
        }
    },
    ["DateService", "FileService1", "PixelWidth"],
);

export interface ImageService {
    readonly pxWidth: number;
    readonly video: VideoService;
}

export const ImageService = context.inject(
    class {
        readonly pxWidth: number;
        readonly video: VideoService;
        constructor(pxWidth: number, video: VideoService) {
            this.pxWidth = pxWidth;
            this.video = video;
        }
    },
    ["PixelWidth", "VideoService"],
);

export interface VideoService {
    readonly date: DateService;
}

export const VideoService = context.inject(
    class {
        readonly date: DateService;
        constructor(date: DateService) {
            this.date = date;
        }
    },
    ["DateService"],
);

export interface FileService {
    readonly date: DateService;
    readonly image: ImageService;
    readonly video: VideoService;
}

export const FileService0 = context.inject(
    class {
        readonly date: DateService;
        readonly image: ImageService;
        readonly video: VideoService;
        constructor(
            image: ImageService,
            video: VideoService,
            date: DateService,
        ) {
            this.date = date;
            this.image = image;
            this.video = video;
        }
    },
    ["ImageService", "VideoService", "DateService"],
);

export const FileService1 = context.inject(
    class {
        readonly date: DateService;
        readonly image: ImageService;
        readonly video: VideoService;
        constructor(
            image: ImageService,
            video: VideoService,
            date: DateService,
        ) {
            this.date = date;
            this.image = image;
            this.video = video;
        }
    },
    ["ImageService", "VideoService", "DateService"],
);

export const ImageServiceNew = context.inject(
    class {
        readonly pxWidth: number;
        readonly video: VideoService;
        constructor(pxWidth: number, video: VideoService) {
            this.pxWidth = pxWidth;
            this.video = video;
        }
    },
    ["PixelWidth", "VideoService"],
);
