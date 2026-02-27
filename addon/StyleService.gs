/**
 * StyleService.gs — Document styling, formatting, and design element insertion
 */

// =============================================================================
// Scene Breaks
// =============================================================================

/**
 * Insert a scene break at the cursor position.
 * @param {string} symbol - The scene break symbol (e.g., '* * *', '\u2766')
 */
function insertSceneBreak(symbol) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();

    if (!cursor) {
      throw new Error('Place your cursor where you want the scene break.');
    }

    var body = doc.getBody();
    var element = cursor.getElement();

    // Find parent paragraph
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    if (!paragraph) throw new Error('Could not find a valid position.');

    var parentIndex = body.getChildIndex(paragraph);

    // Insert blank line + scene break + blank line
    body.insertParagraph(parentIndex + 1, '');
    var breakPara = body.insertParagraph(parentIndex + 2, symbol || '* * *');
    breakPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    breakPara.setSpacingBefore(12);
    breakPara.setSpacingAfter(12);

    // Style the break symbol
    var text = breakPara.editAsText();
    text.setFontSize(14);
    text.setForegroundColor('#999999');

    body.insertParagraph(parentIndex + 3, '');

    return { success: true };
  } catch (error) {
    throw new Error('Insert scene break failed: ' + error.message);
  }
}

// =============================================================================
// Drop Caps
// =============================================================================

/**
 * Apply drop cap styling to the first letter of the paragraph at cursor.
 * Note: Google Docs cannot truly render drop caps inline.
 * This applies a named style that the export engine uses.
 * @param {object} options - { fontSize, fontFamily, color }
 */
function applyDropCapStyle(options) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();

    if (!cursor) {
      throw new Error('Place your cursor in the paragraph to apply drop cap.');
    }

    var element = cursor.getElement();
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    if (!paragraph) throw new Error('Not in a paragraph.');

    var text = paragraph.asParagraph().editAsText();
    var content = text.getText();

    if (content.length === 0) throw new Error('Paragraph is empty.');

    // Style the first letter larger
    var fontSize = (options && options.fontSize) || 36;
    var color = (options && options.color) || '#333333';

    text.setFontSize(0, 0, fontSize);
    text.setBold(0, 0, true);
    if (color) text.setForegroundColor(0, 0, color);

    // Mark paragraph with a named style attribute for export
    // (Google Docs doesn't have custom attributes, so we use a convention)
    var props = PropertiesService.getDocumentProperties();
    var dropCaps = JSON.parse(props.getProperty('dropCaps') || '[]');
    dropCaps.push({
      paragraphText: content.substring(0, 20),
      options: options,
    });
    props.setProperty('dropCaps', JSON.stringify(dropCaps));

    return { success: true };
  } catch (error) {
    throw new Error('Drop cap failed: ' + error.message);
  }
}

// =============================================================================
// Text Message Bubbles
// =============================================================================

/**
 * Insert formatted text message bubbles.
 * Uses a table to simulate chat bubbles in Google Docs.
 * @param {Array<{sender: string, text: string, isSent: boolean}>} messages
 */
function insertTextMessages(messages) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var cursor = doc.getCursor();

    if (!cursor) throw new Error('Place your cursor where you want the messages.');

    var element = cursor.getElement();
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    var insertIndex = body.getChildIndex(paragraph) + 1;

    messages.forEach(function(msg, i) {
      // Create a 1-column table for each message
      var table = body.insertTable(insertIndex + i);
      var row = table.appendTableRow();
      var cell = row.appendTableCell();

      // Sender name
      if (msg.sender) {
        var senderPara = cell.appendParagraph(msg.sender);
        senderPara.editAsText().setFontSize(9);
        senderPara.editAsText().setForegroundColor('#888888');
        senderPara.editAsText().setBold(true);
      }

      // Message text
      var msgPara = cell.appendParagraph(msg.text);
      msgPara.editAsText().setFontSize(11);

      // Style the table cell
      if (msg.isSent) {
        cell.setBackgroundColor('#DCF8C6'); // WhatsApp green
        table.setAttributes({
          'BORDER_WIDTH': 0,
        });
        // Right-align sent messages
        cell.setPaddingLeft(40);
        cell.setPaddingRight(8);
      } else {
        cell.setBackgroundColor('#FFFFFF');
        cell.setPaddingLeft(8);
        cell.setPaddingRight(40);
      }

      cell.setPaddingTop(6);
      cell.setPaddingBottom(6);

      // Remove the default empty paragraph
      if (cell.getNumChildren() > 2) {
        cell.removeChild(cell.getChild(0));
      }
    });

    return { success: true, count: messages.length };
  } catch (error) {
    throw new Error('Insert text messages failed: ' + error.message);
  }
}

// =============================================================================
// Call-Out Boxes
// =============================================================================

/**
 * Insert a call-out box at the cursor position.
 * @param {object} options - { title, text, bgColor, borderColor, icon }
 */
function insertCalloutBox(options) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var cursor = doc.getCursor();

    if (!cursor) throw new Error('Place your cursor where you want the callout.');

    var element = cursor.getElement();
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    var insertIndex = body.getChildIndex(paragraph) + 1;

    // Create a bordered table as callout box
    var table = body.insertTable(insertIndex);
    var row = table.appendTableRow();
    var cell = row.appendTableCell();

    // Title
    if (options.title) {
      var titlePara = cell.appendParagraph((options.icon || '') + ' ' + options.title);
      titlePara.editAsText().setBold(true);
      titlePara.editAsText().setFontSize(13);
      titlePara.editAsText().setForegroundColor(options.borderColor || '#1E40AF');
    }

    // Content
    var contentPara = cell.appendParagraph(options.text || '');
    contentPara.editAsText().setFontSize(11);

    // Style
    cell.setBackgroundColor(options.bgColor || '#EFF6FF');
    cell.setPaddingTop(12);
    cell.setPaddingBottom(12);
    cell.setPaddingLeft(16);
    cell.setPaddingRight(16);

    // Remove default empty paragraph
    if (cell.getNumChildren() > 2) {
      cell.removeChild(cell.getChild(0));
    }

    return { success: true };
  } catch (error) {
    throw new Error('Insert callout failed: ' + error.message);
  }
}

// =============================================================================
// Theme Application
// =============================================================================

/**
 * Apply a theme to the entire document.
 * @param {object} themeConfig - Theme configuration object
 */
function applyTheme(themeConfig) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();

    // Body text style
    var bodyStyle = {};
    bodyStyle[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.bodyFont || 'Georgia';
    bodyStyle[DocumentApp.Attribute.FONT_SIZE] = parseInt(themeConfig.fontSize) || 11;
    bodyStyle[DocumentApp.Attribute.LINE_SPACING] = themeConfig.lineHeight || 1.6;
    bodyStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#1a1a1a';
    body.setAttributes(bodyStyle);

    // Apply heading styles
    var numChildren = body.getNumChildren();
    for (var i = 0; i < numChildren; i++) {
      var child = body.getChild(i);
      if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
        var para = child.asParagraph();
        var heading = para.getHeading();

        if (heading === DocumentApp.ParagraphHeading.HEADING1) {
          var h1Style = {};
          h1Style[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.headingFont || themeConfig.bodyFont || 'Georgia';
          h1Style[DocumentApp.Attribute.FONT_SIZE] = 24;
          h1Style[DocumentApp.Attribute.BOLD] = true;
          h1Style[DocumentApp.Attribute.FOREGROUND_COLOR] = themeConfig.colorAccent || '#333333';
          para.setAttributes(h1Style);
          para.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        } else if (heading === DocumentApp.ParagraphHeading.HEADING2) {
          var h2Style = {};
          h2Style[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.headingFont || themeConfig.bodyFont || 'Georgia';
          h2Style[DocumentApp.Attribute.FONT_SIZE] = 18;
          h2Style[DocumentApp.Attribute.BOLD] = true;
          para.setAttributes(h2Style);
        } else if (heading === DocumentApp.ParagraphHeading.HEADING3) {
          var h3Style = {};
          h3Style[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.headingFont || themeConfig.bodyFont || 'Georgia';
          h3Style[DocumentApp.Attribute.FONT_SIZE] = 14;
          h3Style[DocumentApp.Attribute.BOLD] = true;
          para.setAttributes(h3Style);
        }
      }
    }

    // Save theme to document properties
    PropertiesService.getDocumentProperties().setProperty(
      'currentTheme',
      JSON.stringify(themeConfig)
    );

    return { success: true, appliedTheme: themeConfig.name || 'Custom' };
  } catch (error) {
    throw new Error('Apply theme failed: ' + error.message);
  }
}

/**
 * Get the currently applied theme.
 * @returns {object|null}
 */
function getCurrentTheme() {
  var themeStr = PropertiesService.getDocumentProperties().getProperty('currentTheme');
  return themeStr ? JSON.parse(themeStr) : null;
}

// =============================================================================
// Front/Back Matter
// =============================================================================

/**
 * Insert front matter template.
 * @param {string} type - 'title-page', 'copyright', 'dedication', 'toc'
 * @param {object} data - Template data
 */
function insertFrontMatter(type, data) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();

    // Insert at the beginning of the document
    var insertIndex = 0;

    switch (type) {
      case 'title-page':
        var titlePara = body.insertParagraph(insertIndex, data.title || 'Book Title');
        titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        titlePara.setSpacingBefore(200);

        if (data.subtitle) {
          var subPara = body.insertParagraph(insertIndex + 1, data.subtitle);
          subPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
          subPara.editAsText().setFontSize(16);
          subPara.editAsText().setItalic(true);
        }

        var authorPara = body.insertParagraph(insertIndex + (data.subtitle ? 2 : 1), data.author || 'Author Name');
        authorPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        authorPara.editAsText().setFontSize(14);
        authorPara.setSpacingBefore(40);

        // Page break after title page
        body.insertParagraph(insertIndex + (data.subtitle ? 3 : 2), '').setPageBreakBefore(true);
        break;

      case 'copyright':
        var cpPara = body.insertParagraph(insertIndex, 'Copyright');
        cpPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);

        var year = new Date().getFullYear();
        var cpText = 'Copyright \u00A9 ' + year + ' ' + (data.author || 'Author Name') + '\n\n' +
          'All rights reserved. No part of this publication may be reproduced, ' +
          'distributed, or transmitted in any form or by any means without the prior ' +
          'written permission of the publisher.\n\n' +
          (data.isbn ? 'ISBN: ' + data.isbn + '\n\n' : '') +
          (data.publisher ? 'Published by ' + data.publisher + '\n' : '') +
          (data.edition ? data.edition + '\n' : '');

        body.insertParagraph(insertIndex + 1, cpText);
        body.insertParagraph(insertIndex + 2, '').setPageBreakBefore(true);
        break;

      case 'dedication':
        var dedPara = body.insertParagraph(insertIndex, 'Dedication');
        dedPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);

        var dedText = body.insertParagraph(insertIndex + 1, data.text || 'For...');
        dedText.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        dedText.editAsText().setItalic(true);
        dedText.setSpacingBefore(100);

        body.insertParagraph(insertIndex + 2, '').setPageBreakBefore(true);
        break;

      default:
        throw new Error('Unknown front matter type: ' + type);
    }

    return { success: true, type: type };
  } catch (error) {
    throw new Error('Insert front matter failed: ' + error.message);
  }
}
