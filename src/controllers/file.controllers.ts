import type { Request, Response } from "express";
import { definePDFJSModule, getDocumentProxy, renderPageAsImage } from "unpdf";
import { fromError, isValidationError } from "zod-validation-error";
import { base64StrToBuffer, bufferToBase64Str } from "../lib/utils";
import { file } from "../models/file";

export const parsePdf = async (req: Request, res: Response) => {
	try {
		const body = file.parse(req.body);
		const buffer = new Uint8Array(base64StrToBuffer(body.data));

		if (!body.pages) {
			const pdf = await getDocumentProxy(new Uint8Array(buffer));
			body.pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
		}
		await definePDFJSModule(() => import("pdfjs-dist"));
		const imgReqs = body.pages.map(async (p) => {
			return await renderPageAsImage(buffer, p, {
				canvasImport: () => import("@napi-rs/canvas"),
				scale: 2,
			});
		});
		const imgs = await Promise.all(imgReqs);
		const base64Images = imgs.map((img) => bufferToBase64Str(Buffer.from(img)));
		// call ollama to generate markdown from images
		res.status(200).json({});
		return;
	} catch (err) {
		if (isValidationError(err)) {
			const errorMsg = fromError(err);
			res.status(400).json({ error: `Invalid input: ${errorMsg}` });
			return;
		}
		const errorMsg = err instanceof Error ? err.toString() : "Unknown error";
		res.status(500).json({ error: errorMsg });
	}
};
