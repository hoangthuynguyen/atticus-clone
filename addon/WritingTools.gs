/**
 * WritingTools.gs — Word count, sprint timer data, writing streak, smart quotes
 */

// =============================================================================
// Word Count
// =============================================================================

/**
 * Get word count statistics for the document.
 * @returns {{ total: number, characters: number, paragraphs: number, chapters: number }}
 */
function getWordCount() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var text = body.getText();

    var words = text.split(/\s+/).filter(function(w) { return w.length > 0; });
    var characters = text.replace(/\s/g, '').length;

    // Count paragraphs
    var paragraphs = 0;
    var numChildren = body.getNumChildren();
    for (var i = 0; i < numChildren; i++) {
      if (body.getChild(i).getType() === DocumentApp.ElementType.PARAGRAPH) {
        var paraText = body.getChild(i).asParagraph().getText().trim();
        if (paraText.length > 0) paragraphs++;
      }
    }

    // Count chapters (H1 headings)
    var chapters = 0;
    for (var i = 0; i < numChildren; i++) {
      if (body.getChild(i).getType() === DocumentApp.ElementType.PARAGRAPH) {
        if (body.getChild(i).asParagraph().getHeading() === DocumentApp.ParagraphHeading.HEADING1) {
          chapters++;
        }
      }
    }

    return {
      total: words.length,
      characters: characters,
      paragraphs: paragraphs,
      chapters: chapters,
    };
  } catch (error) {
    throw new Error('Word count failed: ' + error.message);
  }
}

/**
 * Get word count for the currently selected text.
 * @returns {{ selected: number }}
 */
function getSelectionWordCount() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var selection = doc.getSelection();

    if (!selection) {
      return { selected: 0, message: 'No text selected' };
    }

    var elements = selection.getRangeElements();
    var totalWords = 0;

    elements.forEach(function(rangeElement) {
      var element = rangeElement.getElement();
      var text;

      if (rangeElement.isPartial()) {
        text = element.asText().getText().substring(
          rangeElement.getStartOffset(),
          rangeElement.getEndOffsetInclusive() + 1
        );
      } else {
        text = element.asText ? element.asText().getText() : '';
      }

      var words = text.split(/\s+/).filter(function(w) { return w.length > 0; });
      totalWords += words.length;
    });

    return { selected: totalWords };
  } catch (error) {
    throw new Error('Selection word count failed: ' + error.message);
  }
}

// =============================================================================
// Daily Writing Stats (stored in UserProperties + Supabase via backend)
// =============================================================================

/**
 * Get today's word count progress.
 * @returns {{ today: number, goal: number, percentage: number }}
 */
function getDailyProgress() {
  try {
    var props = PropertiesService.getUserProperties();
    var today = new Date().toISOString().split('T')[0];

    var dailyData = JSON.parse(props.getProperty('daily_' + today) || '{"words":0}');
    var goal = parseInt(props.getProperty('daily_goal') || '1000');

    return {
      today: dailyData.words,
      goal: goal,
      percentage: Math.min(100, Math.round((dailyData.words / goal) * 100)),
      date: today,
    };
  } catch (error) {
    throw new Error('Get daily progress failed: ' + error.message);
  }
}

/**
 * Update today's word count.
 * Called periodically from the sidebar to track writing progress.
 */
function updateDailyWordCount() {
  try {
    var wordCount = getWordCount();
    var props = PropertiesService.getUserProperties();
    var today = new Date().toISOString().split('T')[0];

    var prevKey = 'doc_wc_' + DocumentApp.getActiveDocument().getId();
    var prevCount = parseInt(props.getProperty(prevKey) || '0');
    var wordsWrittenToday = Math.max(0, wordCount.total - prevCount);

    // Update today's stats
    var dailyData = JSON.parse(props.getProperty('daily_' + today) || '{"words":0}');
    dailyData.words += wordsWrittenToday;
    props.setProperty('daily_' + today, JSON.stringify(dailyData));

    // Update baseline
    props.setProperty(prevKey, String(wordCount.total));

    // Mark today as a writing day for streak calculation
    updateWritingStreak_();

    return {
      wordsToday: dailyData.words,
      wordsJustAdded: wordsWrittenToday,
    };
  } catch (error) {
    throw new Error('Update daily count failed: ' + error.message);
  }
}

/**
 * Set daily word count goal.
 * @param {number} goal - Words per day target
 */
function setDailyGoal(goal) {
  PropertiesService.getUserProperties().setProperty('daily_goal', String(goal));
  return { success: true, goal: goal };
}

// =============================================================================
// Writing Streak
// =============================================================================

/**
 * Get writing streak information.
 * @returns {{ currentStreak: number, longestStreak: number, totalDays: number, last30Days: Array }}
 */
function getWritingStreak() {
  try {
    var props = PropertiesService.getUserProperties();
    var streakData = JSON.parse(props.getProperty('writing_streak') || '{"days":[]}');
    var days = streakData.days || [];

    // Sort descending
    days.sort(function(a, b) { return b.localeCompare(a); });

    // Calculate current streak
    var currentStreak = 0;
    var today = new Date().toISOString().split('T')[0];
    var yesterday = getYesterdayDate_();

    if (days.length > 0 && (days[0] === today || days[0] === yesterday)) {
      currentStreak = 1;
      for (var i = 1; i < days.length; i++) {
        var prev = new Date(days[i - 1]);
        var curr = new Date(days[i]);
        var diff = (prev - curr) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    var longestStreak = days.length > 0 ? 1 : 0;
    var tempStreak = 1;
    for (var i = 1; i < days.length; i++) {
      var prev = new Date(days[i - 1]);
      var curr = new Date(days[i]);
      var diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Last 30 days heatmap data
    var last30 = [];
    var d = new Date();
    for (var i = 0; i < 30; i++) {
      var dateStr = d.toISOString().split('T')[0];
      var dailyData = JSON.parse(props.getProperty('daily_' + dateStr) || '{"words":0}');
      last30.push({
        date: dateStr,
        words: dailyData.words,
        wrote: days.indexOf(dateStr) >= 0,
      });
      d.setDate(d.getDate() - 1);
    }

    return {
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      totalDays: days.length,
      last30Days: last30.reverse(),
    };
  } catch (error) {
    throw new Error('Get streak failed: ' + error.message);
  }
}

function updateWritingStreak_() {
  var props = PropertiesService.getUserProperties();
  var streakData = JSON.parse(props.getProperty('writing_streak') || '{"days":[]}');
  var today = new Date().toISOString().split('T')[0];

  if (streakData.days.indexOf(today) === -1) {
    streakData.days.push(today);
    // Keep only last 365 days
    if (streakData.days.length > 365) {
      streakData.days = streakData.days.slice(-365);
    }
    props.setProperty('writing_streak', JSON.stringify(streakData));
  }
}

function getYesterdayDate_() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// =============================================================================
// Smart Quotes Scanner
// =============================================================================

/**
 * Scan document for inconsistent smart quotes.
 * @returns {{ issues: Array, totalIssues: number }}
 */
function scanSmartQuotes() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var text = body.getText();
    var issues = [];

    // Check for straight quotes mixed with curly quotes
    var straightSingle = (text.match(/'/g) || []).length;
    var curlySingleOpen = (text.match(/\u2018/g) || []).length;
    var curlySingleClose = (text.match(/\u2019/g) || []).length;
    var straightDouble = (text.match(/"/g) || []).length;
    var curlyDoubleOpen = (text.match(/\u201C/g) || []).length;
    var curlyDoubleClose = (text.match(/\u201D/g) || []).length;

    if (straightSingle > 0 && (curlySingleOpen > 0 || curlySingleClose > 0)) {
      issues.push({
        type: 'mixed-single',
        message: straightSingle + " straight single quotes found alongside " +
                 (curlySingleOpen + curlySingleClose) + " curly single quotes",
        count: straightSingle,
      });
    }

    if (straightDouble > 0 && (curlyDoubleOpen > 0 || curlyDoubleClose > 0)) {
      issues.push({
        type: 'mixed-double',
        message: straightDouble + " straight double quotes found alongside " +
                 (curlyDoubleOpen + curlyDoubleClose) + " curly double quotes",
        count: straightDouble,
      });
    }

    // Check for unmatched quotes
    if (curlyDoubleOpen !== curlyDoubleClose) {
      issues.push({
        type: 'unmatched-double',
        message: "Unmatched curly double quotes: " + curlyDoubleOpen +
                 " opening vs " + curlyDoubleClose + " closing",
        count: Math.abs(curlyDoubleOpen - curlyDoubleClose),
      });
    }

    return {
      issues: issues,
      totalIssues: issues.reduce(function(sum, i) { return sum + i.count; }, 0),
      stats: {
        straightSingle: straightSingle,
        curlySingle: curlySingleOpen + curlySingleClose,
        straightDouble: straightDouble,
        curlyDouble: curlyDoubleOpen + curlyDoubleClose,
      },
    };
  } catch (error) {
    throw new Error('Smart quotes scan failed: ' + error.message);
  }
}

/**
 * Fix all straight quotes to curly quotes.
 * @returns {{ fixed: number }}
 */
function fixSmartQuotes() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var fixed = 0;

    // Replace straight double quotes
    var searchResult = body.findText('"');
    while (searchResult) {
      var element = searchResult.getElement();
      var start = searchResult.getStartOffset();
      var text = element.asText();
      var content = text.getText();

      // Determine if opening or closing
      var charBefore = start > 0 ? content[start - 1] : ' ';
      var isOpening = charBefore === ' ' || charBefore === '\n' || start === 0;

      text.deleteText(start, start);
      text.insertText(start, isOpening ? '\u201C' : '\u201D');
      fixed++;

      searchResult = body.findText('"', searchResult);
    }

    // Replace straight single quotes (apostrophes)
    searchResult = body.findText("'");
    while (searchResult) {
      var element = searchResult.getElement();
      var start = searchResult.getStartOffset();
      var text = element.asText();
      var content = text.getText();

      var charBefore = start > 0 ? content[start - 1] : ' ';
      var isOpening = charBefore === ' ' || charBefore === '\n' || start === 0;

      text.deleteText(start, start);
      text.insertText(start, isOpening ? '\u2018' : '\u2019');
      fixed++;

      searchResult = body.findText("'", searchResult);
    }

    return { fixed: fixed };
  } catch (error) {
    throw new Error('Fix quotes failed: ' + error.message);
  }
}
