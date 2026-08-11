import { Router } from "express";
import multer from "multer";
import { createSource } from "../controllers/upload.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadLimiter } from "../middlewares/ratelimit.middleware.js";
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { cloudinary } from "../../config/cloudinary.js";

const router = Router()

const ALLOWED_MIME = {
  PDF: ['application/pdf'],
  VTT: ['text/vtt', 'text/plain']
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 //20mb

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.toLowerCase().split('.').pop()
    return {
      folder: 'rag-sources',
      resource_type: 'raw', // required for non-image files (PDF, VTT)
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
      format: ext,
    }
  }
})

// const storage = multer.diskStorage({
//   destination: 'src/uploads/',
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
//     cb(null, unique + path.extname(file.originalname))
//   }
// })

router.use(requireAuth())

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const type = req.body.type
    const ext = path.extname(file.originalname).toLowerCase()

    if (ext === '.pdf' && ALLOWED_MIME.PDF.includes(file.mimetype)) return cb(null, true)
    if (ext === '.vtt') return cb(null, true)

    cb(new Error(`Invalid file type: ${ext}. Only .pdf and .vtt allowed.`))
  }
});

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Max 20mb' })
    }
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
  next()
}

// router.post("/", upload.single("document"), (req, res) => {
//   console.log("REQ FILE:", req.file);

//   res.json({
//     success: true,
//     file: req.file,
//   });
// });

router.post('/', uploadLimiter, upload.single('document'), handleUploadError, createSource)

export default router