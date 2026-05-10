import { UnusedName } from "../src";
import {
    NameService,
    DateService,
    ChatService,
    ImageService,
    VideoService,
    FileService,
} from "./setup";

// prettier-ignore
export const injector = UnusedName.asyncBuilder()
    .transient("DateService").use<DateService>(async () => (await import("./setup")).DateServiceImpl)
    .singleton("AppId").use(() => () => "AnApp", { kind: "factory" })
    .singleton("GlobalConfig").use(async () => (await import("./setup")).GlobalConfig)
    .singleton("NameService").use<NameService>(async () => (await import("./setup")).NameServiceFactory,{ kind: "factory" })
    .transient("ChatService").use<ChatService>(async () => (await import("./setup")).ChatServiceImpl)
    .scoped("ImageService").use<ImageService>(async () => (await import("./setup")).ImageServiceImpl)
    .singleton("VideoService").use<VideoService>(async () => (await import("./setup")).VideoServiceImpl)
    .transient("FileService0").use<FileService>(async () => (await import("./setup")).FileServiceImpl)
    .singleton("FileService1").use<FileService>(async () => (await import("./setup")).FileServiceImpl2)
    .singleton("PixelWidth").use(() => () => 16, { kind: "factory" });
