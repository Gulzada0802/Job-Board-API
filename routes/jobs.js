import express from "express";
import { createJob, deleteJob, listJobs, updateJob } from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, listJobs)
router.post("/", authMiddleware, authorizeRoles("employer"), createJob);
router.put("/:id", authMiddleware, authorizeRoles("employer"), updateJob);
router.delete("/:id", authMiddleware, authorizeRoles("employer", "admin"), deleteJob);
export default router;
 