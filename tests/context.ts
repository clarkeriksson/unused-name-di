import { UnusedName } from "../src";
import {
	ChatService,
	DateService,
	FileService,
	GlobalConfig,
	ImageService,
	NameService,
	VideoService,
} from "./setup";

export const context = UnusedName.context()
	.service<DateService>()("DateService")
	.service<string>()("AppId")
	.service<symbol>()("TestPrimitive")
	.service<GlobalConfig>()("GlobalConfig")
	.service<NameService>()("NameService")
	.service<ChatService>()("ChatService")
	.service<ImageService>()("ImageService")
	.service<VideoService>()("VideoService")
	.service<FileService>()("FileService0")
	.service<FileService>()("FileService1")
	.service<number>()("PixelWidth")
	.build();
