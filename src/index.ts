import {
    InjectionContainer,
    InjectionContainerBuilder,
    InjectionContainerBuilderImpl,
    AsyncInjectionContainerBuilder,
    AsyncInjectionContainerBuilderImpl,
    CONTAINER,
} from "./container.js";

function builder(): InjectionContainerBuilder {
    return new InjectionContainerBuilderImpl();
}

function asyncBuilder(): AsyncInjectionContainerBuilder {
    return new AsyncInjectionContainerBuilderImpl();
}

const UnusedName = {
    builder,
    asyncBuilder,
    CONTAINER: CONTAINER,
} as const;

export { UnusedName, type InjectionContainer };
