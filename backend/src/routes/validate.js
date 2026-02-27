const express = require('express');
const router = express.Router();

/**
 * POST /validate/epub
 * Validate EPUB structure and content
 * (Lightweight validation - full epubcheck requires Java, deferred to Phase 4)
 */
router.post('/epub', async (req, res) => {
  try {
    const { docContent } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required' });
    }

    const warnings = [];
    const errors = [];

    // Check for H1 headings (chapters)
    const h1Count = (docContent.match(/<h1/gi) || []).length;
    if (h1Count === 0) {
      errors.push({
        type: 'structure',
        message: 'No chapter headings (H1) found. EPUB requires at least one chapter.',
        fix: 'Add Heading 1 style to your chapter titles in Google Docs.',
      });
    }

    // Check for images without alt text
    const imgNoAlt = (docContent.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    if (imgNoAlt > 0) {
      warnings.push({
        type: 'accessibility',
        message: `${imgNoAlt} image(s) missing alt text. This affects accessibility and may fail KDP validation.`,
        fix: 'Add alt text to all images in Google Docs (right-click image > Alt text).',
      });
    }

    // Check for very large images
    const imgCount = (docContent.match(/<img/gi) || []).length;
    if (imgCount > 50) {
      warnings.push({
        type: 'performance',
        message: `${imgCount} images found. Large number of images may cause slow loading on e-readers.`,
        fix: 'Consider compressing images or reducing count for ebook version.',
      });
    }

    // Check for empty paragraphs (common formatting issue)
    const emptyParas = (docContent.match(/<p>\s*<\/p>/gi) || []).length;
    if (emptyParas > 10) {
      warnings.push({
        type: 'formatting',
        message: `${emptyParas} empty paragraphs found. These create inconsistent spacing in ebooks.`,
        fix: 'Use Scene Breaks instead of empty paragraphs for section spacing.',
      });
    }

    // Check for inline styles (should use CSS classes)
    const inlineStyles = (docContent.match(/style="/gi) || []).length;
    if (inlineStyles > 20) {
      warnings.push({
        type: 'formatting',
        message: `${inlineStyles} inline styles detected. Inline styles may not render consistently across e-readers.`,
        fix: 'Use paragraph styles in Google Docs instead of manual formatting.',
      });
    }

    // Check content length
    const textContent = docContent.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    res.json({
      valid: errors.length === 0,
      wordCount,
      chapterCount: h1Count,
      imageCount: imgCount,
      errors,
      warnings,
      summary: errors.length === 0
        ? `Document looks good! ${h1Count} chapters, ${wordCount.toLocaleString()} words.`
        : `Found ${errors.length} error(s) and ${warnings.length} warning(s).`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
});

module.exports = router;
