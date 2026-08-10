import { Router } from "express";
import { queryController } from "../controllers/query.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { queryLimiter } from "../middlewares/ratelimit.middleware.js";

const router = Router()
router.use(requireAuth())

router.post('/', queryLimiter, queryController)

export default router