import CSSMatrix from "dommatrix";
import express from "express";
import { default as fileRouter } from "./routes/file.routes";

global.DOMMatrix = CSSMatrix;

const app = express();
const port = 3000;

app.use(express.json({ limit: "50mb" }));

app.use("/files", fileRouter);

app.listen(port, async () => {
	console.log(`App listening on port ${port}`);
});

export default app;
