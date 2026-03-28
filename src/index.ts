import { type InjectionContainerBuilder, type InjectionContainer, BuilderImpl } from "./builder";

function builder<Services extends ServiceLookup>(): InjectionContainerBuilder<Services, {}> {
    return new BuilderImpl<Services, {}>();
}

const UnusedName = {
    builder
} as const;

export { UnusedName };