# Unused Name DI

Barebones dependency injection container for typescript. No runtime dependencies.

## Getting Started

### ServiceContext

To start, create an Unused-Name service context. The service context acts as a common truth for all derived DI containers and their children to reference. It defines the invariant key-type relationships.

```typescript
const context = UnusedName.context()
    .service<DateService>()("DateService")
    .service<FileService>()("FileService")
    .service<ChatService>()("ChatService")
    .service<string>()("AppId")
    .service<number>()("PixelWidth")
    .service<OtherService>()("OtherService")
    ...
    .build();
```

Service contexts are used to register implementations and their injected dependencies. Injected dependency keys are strictly typed, key arrays corresponding to invalid types, in the wrong order, or of the wrong length will be rejected by the type system.

```typescript
// importing the context from before
import { context } from "...";
import type { ChatService } from "...";

class ChatServiceImpl0 implements ChatService {
    private readonly date: DateService;
    private readonly file: FileService;

    /**
     * constructor takes in args with types
     * registered in the service context used
     * for injection later
     */
    constructor(
        date: DateService,
        file: FileService,
    ) {
        this.date = date;
        this.file = file;
    }
}

// this export behaves as the registered class, 
// with added metadata for use in other checks
export const ChatService0 = context.inject(
    ChatServiceImpl0,
    ["DateService", "FileService"]
);
```

### ServiceContainer

Service containers are where service implementations can be assigned and service keys can be resolved.

```typescript
import { context } from "...";
import { ChatService0 } from "...";
import { DateServiceImpl } from "...";
import { FileServiceImpl } from "...";
import { OtherServiceFactory } from "...";

const container = context.child()
    .instance("AppId", "AppIdValue", "singleton")
    .instance("PixelWidth", 16, "singleton")
    .ctor("DateService", DateServiceImpl, "transient")
    .ctor("FileService", FileServiceImpl, "scoped")
    .ctor("ChatService", ChatService0, "scoped")
    .factory("OtherService", OtherServiceFactory, "singleton")
    .build();

// now these services can all be instantiated via 'container'
const chat: ChatService = container.resolve("ChatService");
const appId: string = container.resolve("AppId");
```

Service containers can also be derived from each other. The altered/added service must be of the correct type and not an already registered singleton service.

```typescript
const child = container.child()
    .ctor("DateService", ..., "singleton")
    .factory("FileService", ..., "scoped")
    .build();

// error caused due to attempted reregistration
// of the parent's singleton service
const invalid = child.child()
    .ctor("DateService", ..., "scoped")
    .build();
```

## Scopes

Scopes in Unused-Name determine the relationship between resolved instances of the same type both within and between containers.

### Transient

Transient services always resolve to a new service instance.

```typescript
let container: ServiceContainer;

const resolved0 = container.resolve("Service");
const resolved1 = container.resolve("Service");
// resolved0 !== resolved1
```

### Scoped

Scoped services resolve to the same instance within a container, but different instances between containers.

```typescript
let container0: ServiceContainer;
let container1: ServiceContainer = container0.child().build();

const container0Resolved0 = container0.resolve("Service");
const container0Resolved1 = container0.resolve("Service");
// container0Resolved0 === container0Resolved1

const container1Resolved0 = container1.resolve("Service");
// container0Resolved0 !== container1Resolved0
```

### Singleton

Singleton services resolve to the same instance in a container and all descendant containers. An important note about singleton services is that their dependencies are resolved a single time in their container of origin. Scoped dependencies will therefore be carried across container boundaries.

```typescript
let container0: ServiceContainer;
let container1: ServiceContainer = container0.child().build();

const container0Resolved0 = container0.resolve("Service");
const container0Resolved1 = container0.resolve("Service");
// container0Resolved0 === container0Resolved1

const container1Resolved0 = container1.resolve("Service");
// container0Resolved0 === container1Resolved0
```
