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
    .useKeys(
        "DateService",
        "AppId",
        "TestPrimitive",
        "GlobalConfig",
        "NameService",
        "ChatService",
        "ImageService",
        "VideoService",
        "FileService0",
        "FileService1",
        "PixelWidth",
    )
    .withTypeMap<{
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
    }>()
    .build();
