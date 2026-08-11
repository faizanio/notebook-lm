import { Router } from "express";
import { createNotebook, getNotebook, listNotebooks } from "../controllers/notebook.controller.js";
import { createSource, deleteSource, listSources, reindexSource } from "../controllers/source.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadLimiter } from "../middlewares/ratelimit.middleware.js";

const router = Router()
router.use(requireAuth())

router.post('/', createNotebook)
router.get('/', listNotebooks)
router.get('/:id', getNotebook)


router.post('/:notebookId/source', uploadLimiter, createSource)
router.get('/:notebookId/source', listSources)

router.delete("/:notebookId/source/:id", deleteSource);

router.post("/:notebookId/source/:id/reindex", reindexSource);

export default router