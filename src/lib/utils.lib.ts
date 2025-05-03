export const base64StrToBuffer = (base64Str: string) => {
	const base64 = base64Str.replace(/^data:application\/pdf;base64,/, "");
	const buffer = Buffer.from(base64, "base64");
	return buffer;
};

export const bufferToBase64Str = (buffer: Buffer, prefix = false) => {
	const base64 = buffer.toString("base64");
	return prefix ? `data:application/pdf;base64,${base64}` : base64;
};

export const batched = <T>(arr: T[], batchSize: number) => {
	const batches: T[][] = [];
	for (let i = 0; i < arr.length; i += batchSize) {
		batches.push(arr.slice(i, i + batchSize));
	}
	return batches;
};
