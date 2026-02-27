const express = require('express');
const router = express.Router();
const { generateEpub } = require('../services/epubGenerator');
const { generatePdf, getTrimSizes } = require('../services/pdfGenerator');
const { uploadExportFile } = require('../services/r2Client');
const { saveExportHistory } = require('../services/supabaseClient');

// =============================================================================
// POST /export/epub
// =============================================================================

router.post('/epub', async (req, res) => {
  try {
    const { docContent, docId, metadata, theme, settings } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[EPUB] Starting export for doc ${docId} by ${req.user.email}`);

    const result = await generateEpub(
      docContent,
      metadata || {},
      theme || {},
      settings || {}
    );

    // Upload to Cloudflare R2
    const { signedUrl, key } = await uploadExportFile(
      result.buffer,
      result.filename,
      'application/epub+zip',
      req.user.id
    );

    // Save to export history in Supabase
    await saveExportHistory(
      req.user.id,
      docId || 'unknown',
      'epub',
      signedUrl,
      result.buffer.length,
      { ...metadata, chapterCount: result.chapterCount, r2Key: key }
    );

    console.log(`[EPUB] Export complete: ${result.filename} (${result.chapterCount} chapters, ${formatBytes(result.buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename: result.filename,
      size: result.buffer.length,
      sizeFormatted: formatBytes(result.buffer.length),
      chapterCount: result.chapterCount,
    });
  } catch (error) {
    console.error('[EPUB] Export failed:', error);
    res.status(500).json({
      error: 'EPUB export failed',
      code: 'EPUB_EXPORT_FAILED',
      details: error.message,
    });
  }
});

// =============================================================================
// POST /export/pdf
// =============================================================================

router.post('/pdf', async (req, res) => {
  try {
    const { docContent, docId, trimSize, theme, settings } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[PDF] Starting export for doc ${docId} (trim: ${trimSize}) by ${req.user.email}`);

    const result = await generatePdf(
      docContent,
      trimSize || '6x9',
      { ...theme, title: (req.body.metadata || {}).title || 'book' },
      settings || {}
    );

    // Upload to Cloudflare R2
    const { signedUrl, key } = await uploadExportFile(
      result.buffer,
      result.filename,
      'application/pdf',
      req.user.id
    );

    // Save to export history
    await saveExportHistory(
      req.user.id,
      docId || 'unknown',
      'pdf',
      signedUrl,
      result.buffer.length,
      { trimSize: result.trimSize, pageCount: result.pageCount, r2Key: key }
    );

    console.log(`[PDF] Export complete: ${result.filename} (${result.pageCount} pages, ${formatBytes(result.buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename: result.filename,
      size: result.buffer.length,
      sizeFormatted: formatBytes(result.buffer.length),
      pageCount: result.pageCount,
      trimSize: result.trimSize,
    });
  } catch (error) {
    console.error('[PDF] Export failed:', error);
    res.status(500).json({
      error: 'PDF export failed',
      code: 'PDF_EXPORT_FAILED',
      details: error.message,
    });
  }
});

// =============================================================================
// POST /export/docx
// =============================================================================

router.post('/docx', async (req, res) => {
  try {
    const { docContent, docId, theme } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[DOCX] Starting export for doc ${docId} by ${req.user.email}`);

    const HTMLtoDOCX = require('html-to-docx');
    // html-to-docx fontSize is in half-points (22 = 11pt). Parse "11pt" → 11 → 22
    const fontSizePt = parseFloat((theme || {}).fontSize) || 11;
    const buffer = await HTMLtoDOCX(docContent, null, {
      font: (theme || {}).fontFamily || 'Georgia',
      fontSize: Math.round(fontSizePt * 2),
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    const filename = `export_${Date.now()}.docx`;
    const { signedUrl, key } = await uploadExportFile(
      Buffer.from(buffer),
      filename,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      req.user.id
    );

    await saveExportHistory(
      req.user.id,
      docId || 'unknown',
      'docx',
      signedUrl,
      buffer.length,
      { r2Key: key }
    );

    console.log(`[DOCX] Export complete: ${filename} (${formatBytes(buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename,
      size: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
    });
  } catch (error) {
    console.error('[DOCX] Export failed:', error);
    res.status(500).json({
      error: 'DOCX export failed',
      code: 'DOCX_EXPORT_FAILED',
      details: error.message,
    });
  }
});

// =============================================================================
// POST /export/txt
// =============================================================================

router.post('/txt', async (req, res) => {
  try {
    const { docContent, docId, metadata } = req.body;
    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[TXT] Starting export for doc ${docId} by ${req.user.email}`);

    const { convert } = require('html-to-text');
    const textContent = convert(docContent, {
      wordwrap: 130
    });

    const filename = `export_${Date.now()}.txt`;
    const buffer = Buffer.from(textContent, 'utf-8');

    const { signedUrl, key } = await uploadExportFile(
      buffer,
      filename,
      'text/plain',
      req.user.id
    );

    await saveExportHistory(
      req.user.id,
      docId || 'unknown',
      'txt',
      signedUrl,
      buffer.length,
      { r2Key: key }
    );

    console.log(`[TXT] Export complete: ${filename} (${formatBytes(buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename,
      size: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
    });
  } catch (error) {
    console.error('[TXT] Export failed:', error);
    res.status(500).json({
      error: 'TXT export failed',
      code: 'TXT_EXPORT_FAILED',
      details: error.message,
    });
  }
});

// =============================================================================
// POST /export/html
// =============================================================================

router.post('/html', async (req, res) => {
  try {
    const { docContent, docId, metadata, theme } = req.body;
    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[HTML] Starting export for doc ${docId} by ${req.user.email}`);

    const title = (metadata || {}).title || 'Document Export';

    // Add some basic styling so it doesn't look completely terrible
    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: ${(theme || {}).fontFamily || 'Georgia, serif'}; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
        h1, h2, h3 { color: #111; }
        img { max-width: 100%; height: auto; }
        .callout-box { padding: 1rem; border-radius: 8px; margin: 1rem 0; }
        .text-msg-container { margin: 1rem 0; }
        .text-msg { padding: 0.75rem 1rem; border-radius: 1rem; max-width: 70%; margin-bottom: 0.5rem; }
        .text-msg-sent { background-color: #dcf8c6; margin-left: auto; border-bottom-right-radius: 0.25rem; }
        .text-msg-received { background-color: #f1f1f1; border-bottom-left-radius: 0.25rem; }
    </style>
</head>
<body>
    ${docContent}
</body>
</html>`;

    const filename = `export_${Date.now()}.html`;
    const buffer = Buffer.from(htmlDocument, 'utf-8');

    const { signedUrl, key } = await uploadExportFile(
      buffer,
      filename,
      'text/html',
      req.user.id
    );

    await saveExportHistory(
      req.user.id,
      docId || 'unknown',
      'html',
      signedUrl,
      buffer.length,
      { r2Key: key }
    );

    console.log(`[HTML] Export complete: ${filename} (${formatBytes(buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename,
      size: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
    });
  } catch (error) {
    console.error('[HTML] Export failed:', error);
    res.status(500).json({
      error: 'HTML export failed',
      code: 'HTML_EXPORT_FAILED',
      details: error.message,
    });
  }
});

// =============================================================================
// GET /export/trim-sizes
// =============================================================================

router.get('/trim-sizes', (req, res) => {
  res.json({ trimSizes: getTrimSizes() });
});

// =============================================================================
// GET /export/history
// =============================================================================

router.get('/history', async (req, res) => {
  try {
    const { getExportHistory } = require('../services/supabaseClient');
    const history = await getExportHistory(req.user.id, parseInt(req.query.limit) || 20);
    res.json({ exports: history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get export history', details: error.message });
  }
});

// =============================================================================
// Helpers
// =============================================================================

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

module.exports = router;
