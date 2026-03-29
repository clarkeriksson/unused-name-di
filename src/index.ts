import { InjectionContainer, InjectionContainerImpl } from "./builder.js";

function builder(): InjectionContainer {
    return new InjectionContainerImpl();
}

const UnusedName = {
    builder
} as const;

export { 
    UnusedName, 
    type InjectionContainer
};