import { bench, describe } from "vitest";
import { context } from "../context";
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

const di = context.child((builder) => {
	return builder
		.instance("AppId", "AnApp", "singleton")
		.instance("PixelWidth", 16, "singleton")
		.ctor("DateService", DateService, "transient")
		.instance("GlobalConfig", GlobalConfig, "singleton")
		.ctor("VideoService", VideoService, "singleton")
		.ctor("ImageService", ImageService, "scoped")
		.ctor("FileService0", FileService0, "transient")
		.ctor("FileService1", FileService1, "singleton")
		.ctor("ChatService", ChatService, "transient")
		.factory("NameService", NameServiceFactory, "singleton");
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
	bench("child", () => {
		const child = di.child((builder) =>
			builder.instance("TestPrimitive", Symbol(), "scoped"),
		);
		sum += Number(child);
	});
});
