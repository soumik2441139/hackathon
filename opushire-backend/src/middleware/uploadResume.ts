import multer from "multer";
import fs from "fs";
import path from "path";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/markdown',
  'text/plain',
  'text/x-markdown'
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.md', '.txt']);

function resolveUploadDir(): string {
  const candidates = [
    process.env.UPLOAD_DIR,
    process.env.WEBSITE_INSTANCE_ID ? "/home/uploads" : undefined,
    path.resolve(process.cwd(), "uploads"),
    path.resolve("/tmp", "uploads"),
  ].filter((p): p is string => Boolean(p && p.trim()));

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {
      // Try next candidate if current directory is unavailable.
    }
  }

  throw new Error("No writable upload directory available. Set UPLOAD_DIR to a writable path.");
}

export const uploadDir = resolveUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"))
});

export default multer({
  storage,
  limits: {
    fileSize: MAX_RESUME_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    
    if (ALLOWED_RESUME_MIME_TYPES.has(mime) || ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File format ${ext} not supported. Use PDF, Word, or Markdown.`) as any, false);
    }
  },
});
