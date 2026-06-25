import { ServiceContextBuilder, ServiceContextBuilderImpl } from "./context";

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
