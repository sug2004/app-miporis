import { updateComplianceRelevance, dashBoardAnalytics } from "../controllers/complaianceController.js";
import express from 'express';

const router = express.Router();

router.put("/update-compliance", updateComplianceRelevance);
router.get("/compliance-overview", dashBoardAnalytics);

export default router;