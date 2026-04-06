import {
    InjectionContainer,
    InjectionContainerBuilder,
    InjectionContainerBuilderImpl,
    InjectionContainerImpl,
} from "./container.js";

function builder(): InjectionContainerBuilder {
    return new InjectionContainerBuilderImpl();
}

const UnusedName = {
    builder,
} as const;

export { UnusedName, type InjectionContainer };
