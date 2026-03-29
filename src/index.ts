import { InjectionContainer, InjectionContainerImpl } from "./builder.js";
import { ServiceLookup } from "./service.js";

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