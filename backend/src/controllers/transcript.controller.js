// transcript.controller.js
// Handles extracting text from uploaded transcript files and saving it on a Project.
// Supported types:
// - TXT: read buffer as UTF-8
// - PDF: pdf-parse
// - DOCX: mammoth.extractRawText({ buffer })

// pdf-parse v2+ exports PDFParse class (not a callable function like v1).
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const Project = require("../models/Project");

// Allowed mimetypes for the "transcript" file upload.
const ALLOWED_MIMETYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Extract transcript text from an uploaded file buffer.
 * @param {{ mimetype: string, buffer: Buffer }} file
 * @returns {Promise<string>}
 */
async function extractTranscriptText(file) {
  // Validate file type before processing.
  if (!file || !file.mimetype || !file.buffer) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  // TXT: decode buffer directly.
  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8");
  }

  // PDF: extract text using pdf-parse v2 API.
  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const textResult = await parser.getText();
      return textResult?.text || "";
    } finally {
      await parser.destroy();
    }
  }

  // DOCX: extract raw text using mammoth.
  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result?.value || "";
  }

  // Should never reach here because mimetype is validated above.
  return "";
}

/**
 * POST /api/transcripts/upload
 * Manager-only: uploads a transcript file and stores extracted text on the Project.
 */
async function uploadTranscript(req, res) {
  try {
    // projectId comes from multipart/form-data fields (req.body).
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    // Multer puts the uploaded file on req.file.
    if (!req.file) {
      return res.status(400).json({ message: "transcript file is required" });
    }

    // Extract text from the uploaded file.
    const extractedTextRaw = await extractTranscriptText(req.file);
    const extractedText = (extractedTextRaw || "").trim();

    // Load project and save transcript context.
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.transcriptContext = extractedText;
    await project.save();

    return res.status(200).json({
      success: true,
      preview: extractedText.slice(0, 300),
    });
  } catch (error) {
    // Provide helpful errors for common cases (bad file type / parse errors).
    console.error("uploadTranscript error:", error.message);
    return res.status(500).json({ message: error.message || "Server error" });
  }
}

module.exports = { uploadTranscript };

