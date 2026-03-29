import { type InjectionContainerBuilder, type InjectionContainer, BuilderImpl } from "./builder.js";
import { ServiceLookup } from "./service.js";

function builder(): InjectionContainerBuilder {
    return new BuilderImpl();
}

const UnusedName = {
    builder
} as const;

export { 
    UnusedName, 
    type InjectionContainer, 
    type InjectionContainerBuilder
};