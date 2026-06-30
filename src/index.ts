import { ServiceContextImpl, type ServiceContext } from "./context";
import { type InstanceRecord } from "./global";

const context = <T extends InstanceRecord>(): ServiceContext<T> =>
	new ServiceContextImpl<T>();

export { context };
