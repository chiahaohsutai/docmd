import express from "express";
import { parsePdf } from "../controllers/file.controllers";

const router = express.Router();

router.post("/pdf", parsePdf);

export default router;
