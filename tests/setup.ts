import { type AppInvariants } from "./context";
import { injector } from "../src";

const inject = injector<AppInvariants>();

export interface GlobalConfig {
	apiKey: string;
}

export const GlobalConfig = {
	apiKey: "keykeykey",
};

export interface NameService {
	chat: ChatService;
}

function NameServiceImplFactory(chat: ChatService): NameService {
	return { chat };
}

export const NameServiceFactory = inject.sync.factory(NameServiceImplFactory, [
	"ChatService",
]);

export interface DateService {
	scopeDate(): Date;
}

class DateServiceImpl implements DateService {
	scopeDate() {
		return new Date();
	}
}

export const DateService = inject.sync.ctor(DateServiceImpl);

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

export const PixelWidth = inject.async.factory(async () => 16 as number);

export const ChatService = inject.sync.ctor(ChatServiceImpl, [
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

export const ImageService = inject.sync.ctor(ImageServiceImpl, [
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

export const VideoService = inject.sync.ctor(VideoServiceImpl, ["DateService"]);

export interface FileService {
	readonly date: DateService;
	readonly image: ImageService;
	readonly video: VideoService;
	readonly px: number;
}

class FileService0Impl implements FileService {
	readonly date: DateService;
	readonly image: ImageService;
	readonly video: VideoService;
	readonly px: number;
	constructor(
		image: ImageService,
		video: VideoService,
		date: DateService,
		px: number,
	) {
		this.date = date;
		this.image = image;
		this.video = video;
		this.px = px;
	}
}

export const FileService0 = inject.sync.ctor(FileService0Impl, [
	"ImageService",
	"VideoService",
	"DateService",
	"PixelWidth",
]);

class FileService1Impl implements FileService {
	readonly date: DateService;
	readonly image: ImageService;
	readonly video: VideoService;
	readonly px: number;
	constructor(
		image: ImageService,
		video: VideoService,
		date: DateService,
		px: number,
	) {
		this.date = date;
		this.image = image;
		this.video = video;
		this.px = px;
	}
}

export const FileService1 = inject.sync.ctor(FileService1Impl, [
	"ImageService",
	"VideoService",
	"DateService",
	"PixelWidth",
]);

class ImageServiceNewImpl implements ImageService {
	readonly pxWidth: number;
	readonly video: VideoService;
	constructor(pxWidth: number, video: VideoService) {
		this.pxWidth = pxWidth;
		this.video = video;
	}
}

export const ImageServiceNew = inject.sync.ctor(ImageServiceNewImpl, [
	"PixelWidth",
	"VideoService",
]);
