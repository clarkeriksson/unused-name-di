import { ServiceContextBuilder, ServiceContextBuilderImpl } from "./context";

function context(): ServiceContextBuilder {
    return new ServiceContextBuilderImpl();
}

const UnusedName = {
    context,
};

export { UnusedName };
