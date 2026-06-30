# Unused Name DI

Tiny and powerful strictly typed dependency injection implementation for typescript. No runtime dependencies.

Featuring:
- Container scoping, container hierarchy
- Lazy service resolution, minimal unnecessary work
- Typed service resolution based on key
- Type checking when injecting services by key
- Minimal runtime checks, static checks do the work
- _NO_ token system, use any valid object key

## Getting Started

### ServiceContext

To create a dependency injection [`ServiceContainer`](#servicecontainer), a `ServiceContext` must be established.

A `ServiceContext` defines invariant key-to-type relationships that all [`ServiceContainer`](#servicecontainer) instances derived from it must adhere to when registering service implementations.

It is strongly advised that the `ServiceContext` is defined in a file that only imports the _types_ of the services rather than the _implementations_, to help avoid circular dependency issues.

Below is an example of how to define a `ServiceContext`.

```typescript
import * as UnusedName from "unused-name";

const context = UnusedName.context<{
	DateService: DateService,
	FileService: FileService,
	ChatService: ChatService,
	AppId: string,
	PixelWidth: number,
	OtherService: OtherService,
}>();
```

A `ServiceContext` is also used to create injectable variants of service providers that are intended for use in the [`ServiceContainer`](#servicecontainer) instances derived from it.

If multiple `ServiceContext` instances plan on using the same service provider, they must all create their own injectable variant.

When creating these injectable service providers, services injected into them must be specified via their keys. This key tuple is strictly typed. Almost any attempts to specify an invalid set of service keys will be marked as a type error.

```typescript
// importing the context from before
import { firstContext } from "...";
import { secondContext } from "...";
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
// It can be used in 'firstContext' containers.
export const ChatServiceFirst = firstContext.inject(ChatServiceImpl, [
	"DateServiceFirst",
	"FileServiceFirst",
]);

// If we wanted to use this service provider in
// 'secondContext' containers then we would need 
// use this variant.
export const ChatServiceSecond = secondContext.inject(ChatServiceImpl, [
	"DateServiceSecond",
	"FileServiceSecond",
]);
```

### ServiceContainer

A `ServiceContainer` is some set of service implementations complying with the root [`ServiceContext`](#servicecontext). They can be created directly from their root [`ServiceContext`](#servicecontext), or derived from other `ServiceContainer` instances.

When creating a new `ServiceContainer`, service implementations can be specified or adjusted. The only limitations are as follows:

-   Registered implementations must comply with the key-to-type relationships defined in the root [`ServiceContext`](#servicecontext)
-   Registered implementations cannot overwrite existing [singleton](#singleton) service implementations
-   Any newly registered service implementations must have all of their service dependencies already registered.

The last restriction above has the added side-effect of preventing most circular dependency situations.

If service implementations need to be altered, the `child()` method found on [`ServiceContext`](#servicecontext) or `ServiceContainer` instances should be used to initialize a `ServiceContainerBuilder`.

If no service implementations need to be altered, the `scope()` method found on `ServiceContainer` instances can be used to directly instantiate another `ServiceContainer` with an identical set of service implementations.

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

Scopes in unused-name determine the relationship between service instances resolved from the same key, both within and between [`ServiceContainer`](#servicecontainer) instances.

### Transient

Transient services always resolve to a new service instance.

```typescript
import { rootContainer } from "...";

const rootResolved0 = rootContainer.resolve("Service");
const rootResolved1 = rootContainer.resolve("Service");
// rootResolved0 !== rootResolved1
```

### Scoped

Scoped services resolve to the same instance within a [`ServiceContainer`](#servicecontainer), but different instances between [`ServiceContainer`](#servicecontainer) instances.

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

Singleton services resolve to the same instance in a [`ServiceContainer`](#servicecontainer) and all descendant [`ServiceContainer`](#servicecontainer) instances. An important note about singleton services is that their dependencies are resolved based on their [`ServiceContainer`](#servicecontainer) of origin. Scoped dependencies will therefore be carried across [`ServiceContainer`](#servicecontainer) boundaries.

```typescript
import { rootContainer } from "...";
let childContainer: ServiceContainer = rootContainer.scope();

const rootResolved0 = rootContainer.resolve("Service");
const rootResolved1 = rootContainer.resolve("Service");
// rootResolved0 === rootResolved1

const childResolved = childContainer.resolve("Service");
// rootResolved0 === childResolved
```
