import { bench, describe } from "vitest";
import * as DI from "../../src/index";
import {
	ChatService,
	DateService,
	FileService0,
	FileService1,
	GlobalConfig,
	ImageService,
	ImageServiceNew,
	NameServiceFactory,
	VideoService,
} from "../setup";
import { AppInvariants } from "../context";

const inject = DI.injector<AppInvariants>();

const di = DI.root<AppInvariants>().child((builder) => {
	return builder
		.add("AppId", inject.instance("AnApp"), "singleton")
		.add("PixelWidth", inject.instance(16), "singleton")
		.add("DateService", DateService, "transient")
		.add(
			"GlobalConfig",
			inject.factory(() => GlobalConfig),
			"singleton",
		)
		.add("VideoService", VideoService, "singleton")
		.add("ImageService", ImageService, "scoped")
		.add("FileService0", FileService0, "transient")
		.add("FileService1", FileService1, "singleton")
		.add("ChatService", ChatService, "transient")
		.addAwaited("NameService", NameServiceFactory, "singleton");
});

describe("benchmarking service resolution", () => {
	const pxWidth = 16;
	const fileService = new FileService1(
		null as any,
		null as any,
		null as any,
		16,
	);
	let sum = 0;
	bench("transient", () => {
		const resolved = di.resolve("ChatService");
		sum += resolved.pxWidth;
	});
	sum = 0;
	bench("scoped", () => {
		const resolved = di.resolve("ImageService");
		sum += resolved.pxWidth;
	});
	sum = 0;
	bench("singleton", () => {
		const resolved = di.resolve("FileService1");
		sum += resolved.px;
	});
	bench("manual", () => {
		const dateService = new DateService();
		const instance = new ChatService(dateService, fileService, pxWidth);
		sum += instance.pxWidth;
	});
});

describe("benchmarking scope creation", () => {
	let sum = 0;
	bench("scope", () => {
		const scope = di.scope();
		sum += Number(scope);
	});
	const newSymbolService = inject.instance(Symbol());
	bench("child", () => {
		const child = di.child((builder) =>
			builder.add("TestPrimitive", newSymbolService, "scoped"),
		);
		sum += Number(child);
	});
});
