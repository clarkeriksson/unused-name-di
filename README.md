# Unused Name DI

Minimal strictly typed dependency injection container for typescript. No runtime dependencies.

## Getting Started

### ServiceContext

To create a dependency injection container, a `ServiceContext` must be established.

A `ServiceContext` defines invariant key-to-type relationships that all containers derived from it must adhere to.

It is strongly advised that the `ServiceContext` is defined in a file that only imports the _types_ of the services rather than the _implementations_, to help avoid circular dependency issues.

Below is an example of building a `ServiceContext`.

```typescript
const context = UnusedName.context()
	.service<DateService>()("DateService")
	.service<FileService>()("FileService")
	.service<ChatService>()("ChatService")
	.service<string>()("AppId")
	.service<number>()("PixelWidth")
	.service<OtherService>()("OtherService")
	.build();
```

A service context is also used to create injectable variants of service providers that are intended for use in the containers derived from it.

If multiple service contexts plan on using the same service provider, they must all create their own injectable variant.

When creating these injectable service providers, services injected into them must be specified via their keys. This key tuple is strictly typed. Any attempt to specify an invalid set of service keys will be marked as a type error.

```typescript
// importing the context from before
import { context0 } from "...";
import { context1 } from "...";
import type { ChatService } from "...";

// base service provider
class ChatServiceImpl implements ChatService {
	private readonly date: DateService;
	private readonly file: FileService;

	/**
	 * constructor takes in args with types
	 * registered in the service context used
	 * for injection later
	 */
	constructor(date: DateService, file: FileService) {
		this.date = date;
		this.file = file;
	}
}

// This export behaves as the registered class,
// with added metadata for use in other checks.
// It can be used in 'context0' containers.
export const ChatService0 = context0.inject(ChatServiceImpl, [
	"DateServiceContext0",
	"FileServiceContext0",
]);

// If we wanted to use this service provider in
// 'context1' containers then we would need use
// this variant.
export const ChatService1 = context1.inject(ChatServiceImpl, [
	"DateServiceContext1",
	"FileServiceContext1",
]);
```

### ServiceContainer

A service container is some set of service implementations complying with the root [service context](#servicecontext). They can be created directly from their root [service context](#servicecontext), or derived from other service containers.

When creating a new service container, service implementations can be specified or adjusted. The only limitations are as follows:

-   Registered implementations must comply with the key-type relationships defined in the root [service context](#servicecontext)
-   Registered implementations cannot overwrite existing [singleton](#singleton) service implementations
-   Any newly registered service implementations must have all of their service dependencies already registered.

The last restriction above has the added side-effect of preventing most circular dependency situations.

If service implementations need to be altered, the `ServiceContext` or `ServiceContainer` `child()` methods should be used to create a new `ServiceContainerBuilder` instance.

If no service implementations need to be altered, the `ServiceContainer` `scope()` method can be used to directly instantiate another container with an identical set of service implementations.

```typescript
import { context } from "...";
import { ChatService0 } from "...";
import { DateServiceImpl } from "...";
import { FileServiceImpl } from "...";
import { OtherServiceFactory } from "...";

const container = context
	.child()
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

```typescript
import { rootContainer } from "...";

function doSomeRequestScoped() {
	const scope = rootContainer.scope();
	const scopedServiceInstance = scope.resolve("ScopedService");
	...
}
```

## Scopes

Scopes in unused-name determine the relationship between service instances resolved from the same key, both within and between containers.

### Transient

Transient services always resolve to a new service instance.

```typescript
import { rootContainer } from "...";

const rootResolved0 = rootContainer.resolve("Service");
const rootResolved1 = rootContainer.resolve("Service");
// rootResolved0 !== rootResolved1
```

### Scoped

Scoped services resolve to the same instance within a container, but different instances between containers.

```typescript
import { rootContainer } from "...";
let childContainer: ServiceContainer = rootContainer.scope();

const rootResolved0 = rootContainer.resolve("Service");
const rootResolved1 = rootContainer.resolve("Service");
// rootResolved0 === rootResolved1

const childResolved = childContainer.resolve("Service");
// rootResolved0 !== childResolved
```

### Singleton

Singleton services resolve to the same instance in a container and all descendant containers. An important note about singleton services is that their dependencies are resolved based on their container of origin. Scoped dependencies will therefore be carried across container boundaries.

```typescript
import { rootContainer } from "...";
let childContainer: ServiceContainer = rootContainer.scope();

const rootResolved0 = rootContainer.resolve("Service");
const rootResolved1 = rootContainer.resolve("Service");
// rootResolved0 === rootResolved1

const childResolved = childContainer.resolve("Service");
// rootResolved0 === childResolved
```
