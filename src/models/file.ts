import { z } from "zod";

export const file = z.object({
	data: z.string().describe("Base64 encoded string"),
	pages: z.array(z.number()).optional().describe("Array of page numbers"),
});
