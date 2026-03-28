import { type InjectionContainerBuilder, type InjectionContainer, BuilderImpl } from "./builder.js";
import { ServiceLookup } from "./service.js";

function builder<Services extends ServiceLookup>(): InjectionContainerBuilder<Services, {}> {
    return new BuilderImpl<Services, {}>();
}

const UnusedName = {
    builder
} as const;

export { UnusedName, type InjectionContainer };