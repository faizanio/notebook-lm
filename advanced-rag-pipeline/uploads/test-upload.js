import express from "express";
import multer from "multer";

const app = express();

const upload = multer({
  dest: "uploads/",
});

app.post("/upload", upload.single("document"), (req, res) => {
  console.log(req.file);

  res.json({
    success: true,
  });
});

app.listen(3000, () => {
  console.log("Running on 3000");
});