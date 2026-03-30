# Unused Name DI

Barebones dependency injection container for typescript.

## Setup Example

```typescript
import { UnusedName } from "unused-name";

/**
 * Register services with:
 *  - Unique key of type PropertyKey
 *  - Service implementation
 *  - (Optional) Interface to register service under
 */
export const di = UnusedName.builder()
    .primitive("AppName").use("SomeAppName")
    .singleton("AppConfig").use(() => AppConfig)
    .transient("FileService").use(() => FileService)
    .primitive("PixelWidth").use(16)
    .transient("ChatService").use<ChatService>(() => ChatServiceImpl)
    .singleton("ImageService").use<ImageService>(() => ImageService)
    .singleton("VideoService").use<VideoService>(() => VideoServiceFactory)
    .transient("EmailService").use<EmailService>(() => EmailServiceGetter);
```

### Definitions

```typescript
class AppConfig {
    apiKey: string = "apikey";
}
di.inject(AppConfig)();
```

```typescript
interface ChatService {
    sendMessage(msg: string): Promise<boolean>;
    getChatHistory(id: string): Promise<string[]>; 
}

@di.dec.inject("ImageService", "VideoService")
class ChatServiceImpl implements ChatService {
    private readonly imageService: ImageUpload;
    private readonly videoService: VideoUpload;

    constructor(images: ImageUpload, videos: VideoUpload) {
        this.imageService = images;
        this.videoService = videos;
    }

    sendMessage(msg) { ... }
    getChatHistory(id) { ... }
}
```

```typescript
class FileService {
    upload(data: number[]): Promise<boolean>;
}
di.inject(FileService)();
```

```typescript
interface ImageService {
    uploadImage(img: string): Promise<boolean>;
}

class ImageServiceImpl implements ImageService {
    private readonly file: FileService;

    static { di.inject(this)("FileService", "PixelWidth") }
    constructor(file: FileService, pixelWidth: number) {
        this.file = file;
    }

    uploadImage(img) { ... }
}
```

```typescript
interface VideoService {
    uploadVideo(vid: string): Promise<boolean>;
}

@di.dec.inject("FileService")
class VideoServiceImpl implements VideoService {
    private readonly file: FileService;

    constructor(file: FileService) {
        this.file = file;
    }

    uploadVideo(vid) { ... }
}
```

```typescript
interface EmailService {
    sendEmail(recipients: string[], subject: string, body: string): Promise<boolean>;
}

function EmailServiceFactory(image: ImageService, video: VideoService, appName: string): EmailService {
    return {
        sendEmail(recipients: string[], subject: string, body: string) { ... }
    }
}
di.inject(EmailServiceFactory)("ImageService", "VideoService", "AppName");
```

## Usage

To get a strongly-typed service instance you can call the 'resolve' method on the DI container.

```typescript
const config: AppConfig = DI.resolve("AppConfig");
const file: FileService = DI.resolve("FileService");
const image: ImageService = DI.resolve("ImageService");
const video: VideoService = DI.resolve("VideoService");
const email: EmailService = DI.resolve("EmailService");
const chat: ChatService = DI.resolve("ChatService");
const pixel: number = DI.resolve("PixelWidth");
const name: string = DI.resolve("AppName");
```

Singleton services will always be the same reference.

```typescript
const config0 = DI.resolve("AppConfig");
const config1 = DI.resolve("AppConfig");
console.log(config0 === config1);
// true
```

Transient services will always be different references.

```typescript
const email0 = DI.resolve("EmailService");
const email1 = DI.resolve("EmailService");
console.log(email0 === email1);
// false
```

Primitive services are returned by value, and therefore readonly. The primitive service option is just a nicer way to
do what is functionally equivalent to registering a primitive getter to a singleton or transient service.

To avoid needing to specify the exact value as a const type at the service provider, primitive services are broadened
to their parent primitive type for the purposes of injection. They are still registered as const types.

```typescript
// WORKS
class PrimitiveExample1 {
    static { di.inject(this)("PixelWidth", "AppName") }
    constructor(pixelWidth: 16, appName: "SomeAppName") {
        ...
    }
}

// ALSO WORKS, PREFERABLE
class PrimitiveExample2 {
    static { di.inject(this)("PixelWidth", "AppName"); }
    constructor(pixelWidth: number, appName: string) {
        ...
    }
}
```