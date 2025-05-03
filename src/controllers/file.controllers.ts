import { performance } from "node:perf_hooks";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import ollama from "ollama";
import { definePDFJSModule, getDocumentProxy, renderPageAsImage } from "unpdf";
import { fromError, isValidationError } from "zod-validation-error";
import {
	base64StrToBuffer,
	batched,
	bufferToBase64Str,
} from "../lib/utils.lib";
import { file } from "../models/file.models";

export const parsePdf = async (req: Request, res: Response) => {
	const id = nanoid();
	performance.mark(`${id}-start`);
	try {
		const body = file.parse(req.body);
		const bytes = () => new Uint8Array(base64StrToBuffer(body.data));

		if (!body.pages) {
			const pdf = await getDocumentProxy(bytes());
			body.pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
		}

		await definePDFJSModule(() => import("pdfjs-dist"));
		const imgReqs = body.pages.map(async (page) => {
			const data = await renderPageAsImage(bytes(), page, {
				canvasImport: () => import("@napi-rs/canvas"),
				scale: 1,
			});
			return { data, page };
		});
		const imgs = await Promise.all(imgReqs);

		const textReqs = imgs.map(async (img) => {
			const { data, page } = img;
			const res = await ollama.generate({
				model: "llava",
				prompt: "Convert the contents of the image to markdown.",
				keep_alive: "5000ms",
				images: [bufferToBase64Str(Buffer.from(data))],
				format: {
					type: "object",
					properties: { content: { type: "string" } },
					required: ["content"],
				},
				options: { temperature: 0.1 },
			});
			return { content: res.response, page };
		});

		const responses: { content: string; page: number }[] = [];
		for (const batch of batched(textReqs, 10)) {
			const texts = await Promise.all(batch);
			responses.push(...texts);
		}
		performance.mark(`${id}-end`);
		const perf = performance.measure(id, `${id}-start`, `${id}-end`);
		res.status(200).json({ content: responses, time: perf.duration });
		return;
	} catch (err) {
		if (isValidationError(err)) {
			const errorMsg = fromError(err);
			res.status(400).json({ error: `Invalid input: ${errorMsg}` });
			return;
		}
		const errorMsg = err instanceof Error ? err.toString() : "Unknown error";
		res.status(500).json({ error: errorMsg });
	} finally {
		performance.clearMarks(`${id}-start`);
		performance.clearMarks(`${id}-end`);
		performance.clearMeasures(id);
	}
};
