import express from "express";
import {
  startSession,
  disconnectSession,
  getSession,
  saveSnapshot,
  getActiveSessionForUser,
  connectSession
} from "../controllers/collab.controller.js";

const router = express.Router();

router.post("/start", startSession); // called by Matching BE -> creates new session 
router.post("/connect/:userId", connectSession); // called by FE when user connects/reconnects
router.post("/disconnect/:userId", disconnectSession); // push to Question History
router.get("/:userId", getActiveSessionForUser); // called by FE to get active session for user


export default router;
