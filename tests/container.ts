import { UnusedName } from "../src";
import {
    NameService,
    DateService,
    ChatService,
    ImageService,
    VideoService,
    FileService,
    GlobalConfig,
} from "./setup";

// prettier-ignore
export const DI = await UnusedName.asyncBuilder()
    .transient("DateService").imported<DateService>().from(() => import("./setup"), "DateServiceImpl")
    .singleton("AppId").use(() => () => "AnApp")
    .singleton("GlobalConfig").imported<GlobalConfig>().from(() => import("./setup"), "GlobalConfig")
    .singleton("NameService").use<NameService>(import("./setup").then((v) => () => v.NameServiceFactory))
    .transient("ChatService").use<ChatService>(import("./setup").then((v) => () => v.ChatServiceImpl))
    .scoped("ImageService").use<ImageService>(import("./setup").then((v) => () => v.ImageServiceImpl))
    .singleton("VideoService").use<VideoService>(import("./setup").then((v) => () => v.VideoServiceImpl))
    .transient("FileService0").use<FileService>(import("./setup").then((v) => () => v.FileServiceImpl))
    .singleton("FileService1").use<FileService>(import("./setup").then((v) => () => v.FileServiceImpl2))
    .singleton("PixelWidth").use(() => () => 16)
    .build();
