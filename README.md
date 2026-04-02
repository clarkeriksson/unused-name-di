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
    .singleton("AppName").use(() => (() => "SomeAppName"))
    .singleton("AppConfig").use(() => AppConfig)
    .transient("FileService").use(() => FileService)
    .singleton("PixelWidth").use(() => (() => 16))
    .transient("ChatService").use<ChatService>(() => ChatServiceImpl)
    .scoped("ImageService").use<ImageService>(() => ImageService)
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

## Service Types

### Singleton

Singleton services will always be the same reference, even across containers.

```typescript
const child = DI.child(); // child container

const config0 = DI.resolve("AppConfig");
const config1 = child.resolve("AppConfig");
console.log(config0 === config1); // true
```

### Scoped

Scoped services will be the same reference within a container, but different references across different containers.

```typescript
const child = DI.child(); // child container

const rootImage0 = DI.resolve("ImageService");
const rootImage1 = DI.resolve("ImageService");
console.log(rootImage0 === rootImage1); // true

const childImage = child.resolve("ImageService");
console.log(rootImage0 === childImage); // false
```

### Transient

Transient services will always be different references.

```typescript
const email0 = DI.resolve("EmailService");
const email1 = DI.resolve("EmailService");
console.log(email0 === email1); // false
```