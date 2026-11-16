# Unused-Name DI

Tiny, strictly typed dependency injection implementation for typescript. No runtime dependencies, less than 1kb zipped.

Featuring:
- Container scoping and hierarchy
- Lazy service resolution
- Dynamic importing of dependencies
- Automatic awaiting of async dependencies when appropriate
- Typed service resolution by key
- Type checking injected services by key
- No token system, use valid object keys

**Contains no generated code or content and never will.**

## Getting Started

### Key-Type Invariants

The type system relies on the developer providing a record type of "dependency keys" to "dependency types". This type
is referred to as "Invariants" in most of the generic types that reference it. It is named so because it represents
the associations between the keys and what types they represent, which cannot change in a container or any of it's
descendants.

For example:

```typescript
import { type FileService } from "...";
import { type EmailService } from "...";
import { type DatabaseService } from "...";

type AppInvariants = {
	"FileService": FileService,
	"EmailService": EmailService,
	"PrimaryDatabaseService": DatabaseService,
	"SecondaryDatabaseService": DatabaseService,
	"AppName": string,
	"AppVersion": number
}
```

Wherever the key `"EmailService"` is used, the type system knows type `EmailService` is associated. The same goes for 
`"PrimaryDatabaseService"` and `DatabaseService`, as well as `"SecondaryDatabaseService"` and `DatabaseService`.

So in the future, when a service is resolved through a [`DependencyContainer`](#Dependency-Containers) like 
`container.resolve("PrimaryDatabaseService")`, the result will be of type `DatabaseService`.

Although all containers will be based on a set of these invariants, they do not have to register an implementation for 
every key-type pair. The invariants also have no bearing on what [`DependencyScope`](#Dependency-Scopes) the 
registrations can have. It simply acts as a contract saying what type each key can represent. 

### Dependency Containers

`DependencyContainer` instances are the most important objects in this library. They are built through 
`DependencyContainerBuilder` instances, and act as independent scopes for dependency resolution.

`DependencyContainer` instances can implement all of or a subset of the key-type relationships defined in the 
[key-type invariants](#key-type-invariants) associated with it. Services must be registered in a specific order, as in 
order to prevent circular dependencies and ensure proper service construction, the static type checker will ensure all 
of a services dependencies are _already_ registered when it is being registered itself.

#### Building Containers

There are 4 methods available on `DependencyContainerBuilder` instances when registering services:

- `add(key, serviceProvider, scope)`
- `addLazy(key, serviceProviderImporter, scope)`
- `addAwaited(key, asyncServiceProvider, scope)`
- `addLazyAwaited(key, asyncServiceProviderImporter, scope)`

In the context of this library, "lazy" means a provider is dynamically imported only when it is first used and 
"awaited" means a provider returns a promise but can be used for synchronous dependencies. The "awaited" behavior is 
handled by the library when resolving services, but it __will__ make the dependant service resolve asynchronously. The 
type system keeps track of all this, so there should not be mental overhead in keeping track of when a service will 
resolve asynchronously or not.

There are some quirks with the above methods. For example, you can use the `addLazy` method with a service key expecing 
type `Promise<SomeService>` but a provider type returning `SomeService`, since importing it lazily will introduce 
asynchronous behavior into the provider resolution pipeline. If you wanted to lazily import a synchronous service and 
use it for synchronous dependencies, you would need to use `addLazyAwaited`.

This library is designed to only introduce asynchronous behavior when the equivalent raw code for constructing an 
object would introduce it anyways. Asynchronous behavior can be worked around entirely by working with `add` and 
`addLazy` and using service keys that are assigned promise types.

### Dependency Scopes
