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

// prettier-ignore
export const context = UnusedName.context()
    .forKey("DateService").useType<DateService>()
    .forKey("AppId").useType<string>()
    .forKey("TestPrimitive").useType<symbol>()
    .forKey("GlobalConfig").useType<GlobalConfig>()
    .forKey("NameService").useType<NameService>()
    .forKey("ChatService").useType<ChatService>()
    .forKey("ImageService").useType<ImageService>()
    .forKey("VideoService").useType<VideoService>()
    .forKey("FileService0").useType<FileService>()
    .forKey("FileService1").useType<FileService>()
    .forKey("PixelWidth").useType<number>()
    .build();
