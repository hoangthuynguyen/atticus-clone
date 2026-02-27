const EPub = require('epub-gen-memory').default;

// =============================================================================
// EPUB Generator Service
// =============================================================================

/**
 * Generate an EPUB file from HTML content
 * @param {string} docContent - HTML string of the book
 * @param {object} metadata - { title, author, isbn, language }
 * @param {object} theme - { fontFamily, fontSize, lineHeight, margins, headingFont }
 * @param {object} settings - { dropCaps, sceneBreakSymbol, includeChapters, epubStartPage }
 * @returns {{ buffer: Buffer, filename: string, chapterCount: number }}
 */
async function generateEpub(docContent, metadata, theme, settings) {
  const chapters = parseChapters(docContent, settings.includeChapters);

  if (chapters.length === 0) {
    throw new Error('No chapters found. Make sure your document uses Heading 1 for chapter titles.');
  }

  const themeCSS = generateThemeCSS(theme, settings);

  const epubOptions = {
    title: metadata.title || 'Untitled Book',
    author: metadata.author || 'Unknown Author',
    language: metadata.language || 'en',
    css: themeCSS,
    content: chapters.map(ch => ({
      title: ch.title,
      data: ch.html,
    })),
    tocTitle: 'Table of Contents',
    appendChapterTitles: false,
    verbose: false,
  };

  // Add ISBN if provided
  if (metadata.isbn) {
    epubOptions.identifier = metadata.isbn;
  }

  const epubBuffer = await new EPub(epubOptions).genEpub();

  const safeTitle = (metadata.title || 'book')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

  return {
    buffer: Buffer.from(epubBuffer),
    filename: `${safeTitle}.epub`,
    chapterCount: chapters.length,
  };
}

/**
 * Parse HTML into chapter objects by splitting on H1 tags
 */
function parseChapters(html, includeChapters) {
  // Split by H1 headings
  const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
  const parts = html.split(h1Regex);
  const chapters = [];

  // parts[0] = content before first H1 (front matter)
  if (parts[0] && parts[0].trim()) {
    const frontContent = parts[0].trim();
    if (frontContent.length > 10) {
      chapters.push({
        title: 'Front Matter',
        html: frontContent,
      });
    }
  }

  // Iterate pairs: [title, content, title, content, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const title = stripHtml(parts[i]).trim();
    const content = (parts[i + 1] || '').trim();

    // Skip if not in includeChapters filter
    if (includeChapters && includeChapters.length > 0 && !includeChapters.includes(title)) {
      continue;
    }

    if (title) {
      chapters.push({
        title,
        html: content || '<p>&nbsp;</p>',
      });
    }
  }

  return chapters;
}

/**
 * Generate CSS from theme config for EPUB
 */
function generateThemeCSS(theme, settings) {
  const fontFamily = theme.fontFamily || 'Georgia';
  const headingFont = theme.headingFont || fontFamily;
  const fontSize = theme.fontSize || '11pt';
  const lineHeight = theme.lineHeight || 1.6;
  const margins = theme.margins || {};
  const colorAccent = theme.colorAccent || '#333333';

  let css = `
/* === Base Typography === */
body {
  font-family: '${fontFamily}', 'Times New Roman', serif;
  font-size: ${fontSize};
  line-height: ${lineHeight};
  color: #1a1a1a;
  margin: 0;
  padding: 0;
}

p {
  margin: 0 0 0.5em 0;
  text-indent: 1.5em;
  text-align: justify;
  hyphens: auto;
}

/* First paragraph after heading - no indent */
h1 + p, h2 + p, h3 + p,
hr + p, .scene-break + p {
  text-indent: 0;
}

/* === Headings === */
h1 {
  font-family: '${headingFont}', serif;
  font-size: 2em;
  font-weight: bold;
  text-align: center;
  margin: 2em 0 1em 0;
  color: ${colorAccent};
  page-break-before: always;
}

h1:first-of-type {
  page-break-before: avoid;
}

h2 {
  font-family: '${headingFont}', serif;
  font-size: 1.5em;
  font-weight: bold;
  margin: 1.5em 0 0.8em 0;
  color: ${colorAccent};
}

h3 {
  font-family: '${headingFont}', serif;
  font-size: 1.2em;
  font-weight: bold;
  margin: 1.2em 0 0.6em 0;
}

/* === Links === */
a { color: ${colorAccent}; text-decoration: none; }

/* === Images === */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

/* === Block Quotes === */
blockquote {
  margin: 1em 2em;
  padding: 0.5em 1em;
  border-left: 3px solid ${colorAccent};
  font-style: italic;
  color: #555;
}

/* === Lists === */
ul, ol { margin: 0.5em 0; padding-left: 2em; }
li { margin-bottom: 0.3em; }

/* === Scene Breaks === */
.scene-break {
  text-align: center;
  margin: 2em 0;
  font-size: 1.5em;
  color: ${colorAccent};
  letter-spacing: 0.3em;
}

hr {
  border: none;
  text-align: center;
  margin: 2em 0;
}

hr::after {
  content: '${settings.sceneBreakSymbol || '* * *'}';
  font-size: 1.2em;
  letter-spacing: 0.5em;
  color: ${colorAccent};
}
`;

  // Drop Caps
  if (settings.dropCaps) {
    css += `
/* === Drop Caps === */
h1 + p::first-letter,
.chapter-start::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding: 0.1em 0.1em 0 0;
  font-weight: bold;
  color: ${colorAccent};
  font-family: '${headingFont}', serif;
}
`;
  }

  // Text Message Bubbles
  css += `
/* === Text Message Bubbles === */
.text-msg {
  margin: 0.5em 0;
  padding: 0.6em 1em;
  border-radius: 1em;
  max-width: 80%;
  clear: both;
}
.text-msg-sent {
  background: #007AFF;
  color: white;
  float: right;
  border-bottom-right-radius: 0.3em;
}
.text-msg-received {
  background: #E9E9EB;
  color: #1a1a1a;
  float: left;
  border-bottom-left-radius: 0.3em;
}
.text-msg-sender {
  font-size: 0.8em;
  color: #888;
  margin-bottom: 0.2em;
}
.text-msg-container::after {
  content: '';
  display: table;
  clear: both;
}

/* === Call-Out Boxes === */
.callout-box {
  border: 2px solid ${colorAccent};
  border-radius: 8px;
  padding: 1em;
  margin: 1em 0;
  background: #f9f9f9;
}
.callout-box-title {
  font-weight: bold;
  color: ${colorAccent};
  margin-bottom: 0.5em;
}
`;

  return css;
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

module.exports = { generateEpub, parseChapters, generateThemeCSS };
