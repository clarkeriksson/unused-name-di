import { INJECTED, UN_SERVICE_PROVIDER } from "./const";
import { ServiceContextBuilder, ServiceContextBuilderImpl } from "./context";
import { ConstructorOrFactory } from "./global";

function context(): ServiceContextBuilder {
    return new ServiceContextBuilderImpl();
}

/**
 * UnusedName namespace.
 */
const UnusedName = {
    /** Creates a new {@link ServiceContextBuilder}. */
    context,
};

export { UnusedName };
