import * as DI from "../src";
import {
	ChatService,
	DateService,
	FileService,
	GlobalConfig,
	ImageService,
	NameService,
	VideoService,
} from "./setup";

export const context = DI.context<{
	DateService: DateService;
	AppId: string;
	TestPrimitive: symbol;
	GlobalConfig: GlobalConfig;
	NameService: NameService;
	ChatService: ChatService;
	ImageService: ImageService;
	VideoService: VideoService;
	FileService0: FileService;
	FileService1: FileService;
	PixelWidth: number;
}>();
