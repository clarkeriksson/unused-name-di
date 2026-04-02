import { UnusedName } from "../src";
import {
    NameService,
    DateService,
    ChatService,
    ImageService,
    VideoService,
    FileService,
    GlobalConfig,
    NameServiceFactory,
    DateServiceImpl,
    ChatServiceImpl,
    ImageServiceImpl,
    VideoServiceImpl,
    FileServiceImpl,
    FileServiceImpl2
} from "./setup"

export const DI = UnusedName.builder()
    .singleton("AppId").use(() => (() => "AnApp"))
    .singleton("GlobalConfig").use(() => GlobalConfig)
    .singleton("NameService").use<NameService>(() => NameServiceFactory)
    .transient("DateService").use<DateService>(() => DateServiceImpl)
    .transient("ChatService").use<ChatService>(() => ChatServiceImpl)
    .scoped("ImageService").use<ImageService>(() => ImageServiceImpl)
    .singleton("VideoService").use<VideoService>(() => VideoServiceImpl)
    .transient("FileService0").use<FileService>(() => FileServiceImpl)
    .singleton("FileService1").use<FileService>(() => FileServiceImpl2)
    .singleton("PixelWidth").use(() => (() => 16))