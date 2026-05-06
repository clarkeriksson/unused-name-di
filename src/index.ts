import {
    InjectionContainer,
    InjectionContainerBuilder,
    InjectionContainerBuilderImpl,
    AsyncInjectionContainerBuilder,
    AsyncInjectionContainerBuilderImpl,
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
} as const;

export { UnusedName, type InjectionContainer };
