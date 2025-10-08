import express from "express";
import { applyToJob, getMyApplications, getApplicationsForJob, deleteApplication } from "../controllers/applicationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/:id", authMiddleware, authorizeRoles("job_seeker"), applyToJob);
router.get("/my", authMiddleware, authorizeRoles("job_seeker"), getMyApplications);
router.get("/job/:id", authMiddleware, authorizeRoles("employer", "admin"), getApplicationsForJob);
router.delete("/:id", authMiddleware, authorizeRoles("job_seeker", "admin"), deleteApplication);

export default router; 