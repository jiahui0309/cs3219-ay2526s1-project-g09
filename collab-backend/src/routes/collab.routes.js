import express from "express";
import { startSession, endSession } from "../controllers/collab.controller.js";

const router = express.Router();

router.post("/start", startSession);  // called by Matching BE
router.post("/end", endSession);      // push to Question History

export default router;
