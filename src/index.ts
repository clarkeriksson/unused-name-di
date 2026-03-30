import { InjectionContainer, InjectionContainerImpl } from "./container.js";

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