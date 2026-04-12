const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

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
async function extractText(file) {
  if (!file || !file.mimetype || !file.buffer) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  // TXT
  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8");
  }

  // PDF
  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const textResult = await parser.getText();
      return textResult?.text || "";
    } catch (e) {
      console.error("PDF Parse error:", e);
      throw new Error("Failed to parse PDF document.");
    } finally {
      await parser.destroy();
    }
  }

  // DOCX
  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result?.value || "";
    } catch (e) {
      console.error("Mammoth DOCX error:", e);
      throw new Error("Failed to parse Word document.");
    }
  }

  return "";
}

module.exports = { extractText, ALLOWED_MIMETYPES };
