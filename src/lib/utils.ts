export const base64StrToBuffer = (base64Str: string) => {
	const base64 = base64Str.replace(/^data:application\/pdf;base64,/, "");
	const buffer = Buffer.from(base64, "base64");
	return buffer;
};

export const bufferToBase64Str = (buffer: Buffer) => {
	const base64 = buffer.toString("base64");
	return `data:application/pdf;base64,${base64}`;
};
