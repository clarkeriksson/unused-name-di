# Unused Name DI

Barebones dependency injection container for typescript. No runtime dependencies.

## Setup Example

Services are registered by providing:

- A unique key of type PropertyKey
- A getter function returning the service implementation factory/constructor
- (Optionally) an interface to type the service as

This, along with the registration method used (singleton, scoped, or transient) fully define a service for some container.

Services must only use other registered services as constructor or factory arguments.

A built container can be used to inject services into service implementations using the container 'inject' method or 'dec.inject' decorator-style method. The decorator specifically is a TS 5+ decorator rather than an experimental TS decorator. Examples of injection are provided below.

### Container Registration

```typescript
import { UnusedName } from "unused-name";

export const di = UnusedName.builder()
    .singleton("AppName").use(() => (() => "SomeAppName"))
    .singleton("AppConfig").use(() => AppConfig)
    .transient("FileService").use(() => FileService)
    .singleton("PixelWidth").use(() => (() => 16))
    .transient("ChatService").use<ChatService>(() => ChatServiceImpl)
    .scoped("ImageService").use<ImageService>(() => ImageService)
    .singleton("VideoService").use<VideoService>(() => VideoServiceFactory)
    .transient("EmailService").use<EmailService>(() => EmailServiceGetter)
    .build();
```

### Definitions and Injection

```typescript
class AppConfig {
    apiKey: string = "apikey";
}
// method injection
di.inject(AppConfig)();
```

```typescript
interface ChatService {
    sendMessage(msg: string): Promise<boolean>;
    getChatHistory(id: string): Promise<string[]>; 
}

// decorator injection
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
// method injection
di.inject(FileService)();
```

```typescript
interface ImageService {
    uploadImage(img: string): Promise<boolean>;
}

class ImageServiceImpl implements ImageService {
    private readonly file: FileService;

    // method injection, in a static block
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

// decorator injection
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
// method injection
di.inject(EmailServiceFactory)("ImageService", "VideoService", "AppName");
```

## Usage

To get a strongly-typed service instance you can call the 'resolve' method on the DI container.

When resolved, 

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

Singleton services will always be the same reference among the registering container and all of it's children.

```typescript
const child = DI.child().build(); // child container

const config0 = DI.resolve("AppConfig");
const config1 = child.resolve("AppConfig");
console.log(config0 === config1); // true
```

### Scoped

Scoped services will be the same reference within a container, but different references across different containers.

```typescript
const child = DI.child().build(); // child container

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

## Child Containers

Child containers can alter the implementation and service kind (singleton, transient, and scoped) of
non-singleton services. If a service is updated to be a singleton type, it can no longer be altered in the children
of the container that made that alteration.

The type of a service cannot be changed however. If a service is registered under a certain interface, all alterations
must also comply with that interface in all children. This keeps things consistent and allows all injection to be defined using root containers, even if that implementation isn't used in the root. If it is used in a child container the information already has been provided as to what needs to be injected.

However, if a child container implements an entirely new service, that container will have to be used to register injections for implementations that use the new service. This can be done dynamically using the container 'inject' method, though the decorator variant is much more limited in these scenarios.

```typescript
// child of root container, alters the scoped "ImageService" to be transient in the child
const toTransientChild = DI.child()
    .transient("ImageService").use(() => SomeOtherImpl)
    .build();

const transientInstance = toTransientChild.resolve("ImageService");

// child of root container, alters the scoped "ImageService" to be singleton in the child
const toSingletonChild = DI.child()
    .singleton("ImageService").use(() => SomeOtherImpl2)
    .build();

const singletonInstance = toSingletonChild.resolve("ImageService");

// child of "toSingletonChild" container, where "ImageService" was altered to be singleton
// this attempted alteration fails, as it is a child of a container which set the service to singleton
const errorChild = toSingletonChild.child()
    .scoped("ImageService") // an error would appear here
    ...
```