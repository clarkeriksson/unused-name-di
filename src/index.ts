import { ServiceContextImpl, type ServiceContext } from "./context";
import { type InstanceRecord } from "./global";

function context<T extends InstanceRecord = {}>(): ServiceContext<T> {
	return new ServiceContextImpl<T>();
}

/**
 * UnusedName namespace.
 */
const UnusedName = {
	/** Creates a new {@link ServiceContext}. */
	context,
};

export { UnusedName };
