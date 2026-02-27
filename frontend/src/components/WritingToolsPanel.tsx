import { useState, useEffect, useRef } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface WordCountResult {
  total: number;
  characters: number;
  paragraphs: number;
  chapters: number;
}

interface DailyProgress {
  today: number;
  goal: number;
  percentage: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  last30Days: Array<{ date: string; words: number; wrote: boolean }>;
}

export function WritingToolsPanel() {
  const [activeSection, setActiveSection] = useState<'wordcount' | 'sprint' | 'streak' | 'quotes' | 'analyze'>('wordcount');

  return (
    <div className="p-3 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800">Writing Tools</h2>

      <div className="flex flex-wrap gap-1">
        {[
          { id: 'wordcount' as const, label: 'Word Count' },
          { id: 'sprint' as const, label: 'Sprint Timer' },
          { id: 'streak' as const, label: 'Streak' },
          { id: 'quotes' as const, label: 'Smart Quotes' },
          { id: 'analyze' as const, label: 'Analyze' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-2 py-1 rounded text-[11px] font-medium
              ${activeSection === s.id ? 'bg-atticus-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'wordcount' && <WordCountSection />}
      {activeSection === 'sprint' && <SprintTimerSection />}
      {activeSection === 'streak' && <StreakSection />}
      {activeSection === 'quotes' && <SmartQuotesSection />}
      {activeSection === 'analyze' && <AnalyzeSection />}
    </div>
  );
}

// =============================================================================
// Word Count
// =============================================================================

function WordCountSection() {
  const [data, setData] = useState<WordCountResult | null>(null);
  const [daily, setDaily] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [wc, dp] = await Promise.all([
        callGas<WordCountResult>('getWordCount'),
        callGas<DailyProgress>('getDailyProgress'),
      ]);
      setData(wc);
      setDaily(dp);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-3">
      <button onClick={refresh} disabled={loading} className="text-xs text-atticus-600 hover:underline disabled:opacity-50">
        {loading ? 'Counting...' : 'Refresh'}
      </button>

      {data && (
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Words" value={data.total.toLocaleString()} />
          <Stat label="Characters" value={data.characters.toLocaleString()} />
          <Stat label="Paragraphs" value={data.paragraphs.toLocaleString()} />
          <Stat label="Chapters" value={String(data.chapters)} />
        </div>
      )}

      {daily && (
        <div className="p-3 bg-gray-50 rounded">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-gray-600">Daily Goal</span>
            <span className="font-medium">{daily.today} / {daily.goal}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-atticus-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, daily.percentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{daily.percentage}% complete</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-gray-50 rounded">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

// =============================================================================
// Sprint Timer
// =============================================================================

function SprintTimerSection() {
  const [duration, setDuration] = useState(25); // minutes
  const [remaining, setRemaining] = useState(25 * 60); // seconds
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function handleStart() {
    setRunning(true);
  }

  function handlePause() {
    setRunning(false);
  }

  function handleReset() {
    setRunning(false);
    setRemaining(duration * 60);
  }

  return (
    <div className="space-y-4">
      {/* Timer display */}
      <div className="text-center py-4">
        <p className="text-4xl font-mono font-bold text-gray-800">{formatTime(remaining)}</p>
        <p className="text-[11px] text-gray-500 mt-1">
          {remaining === 0 ? 'Sprint Complete!' : running ? 'Writing...' : 'Ready'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={handleStart}
            className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
          >
            {remaining < duration * 60 ? 'Resume' : 'Start Sprint'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 py-2 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {/* Duration presets */}
      <div>
        <label className="text-[11px] text-gray-500 block mb-1">Sprint Duration</label>
        <div className="flex gap-1">
          {[10, 15, 20, 25, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => { setDuration(m); setRemaining(m * 60); setRunning(false); }}
              className={`flex-1 py-1 rounded text-[10px]
                ${duration === m ? 'bg-atticus-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Writing Streak
// =============================================================================

function StreakSection() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  async function loadStreak() {
    try {
      const streak = await callGas<StreakData>('getWritingStreak');
      setData(streak);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="h-20 bg-gray-100 rounded animate-pulse" />;
  if (!data) return <p className="text-[11px] text-gray-500">Could not load streak data.</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Current" value={`${data.currentStreak} days`} />
        <Stat label="Longest" value={`${data.longestStreak} days`} />
        <Stat label="Total" value={`${data.totalDays} days`} />
      </div>

      {/* Heatmap */}
      <div>
        <p className="text-[11px] text-gray-500 mb-1">Last 30 Days</p>
        <div className="grid grid-cols-10 gap-0.5">
          {data.last30Days.map((day, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm"
              title={`${day.date}: ${day.words} words`}
              style={{
                backgroundColor: day.words > 0
                  ? `rgba(37, 99, 235, ${Math.min(1, day.words / 1000)})`
                  : '#f1f5f9',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Smart Quotes Scanner
// =============================================================================

function SmartQuotesSection() {
  const [scanResult, setScanResult] = useState<{ issues: Array<{ type: string; message: string; count: number }>; totalIssues: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setStatus(null);
    try {
      const result = await callGas<typeof scanResult>('scanSmartQuotes');
      setScanResult(result);
    } catch (err) {
      setStatus(`Scan failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleFixAll() {
    setFixing(true);
    try {
      const result = await callGas<{ fixed: number }>('fixSmartQuotes');
      setStatus(`Fixed ${result.fixed} quotes`);
      setScanResult(null);
    } catch (err) {
      setStatus(`Fix failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFixing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">Scan for inconsistent quotation marks</p>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full py-2 bg-atticus-600 text-white rounded text-xs font-medium disabled:opacity-50"
      >
        {loading ? 'Scanning...' : 'Scan Document'}
      </button>

      {status && (
        <p className="text-[11px] p-2 bg-green-50 text-green-600 rounded">{status}</p>
      )}

      {scanResult && (
        <div className="space-y-2">
          {scanResult.totalIssues === 0 ? (
            <p className="text-[11px] text-green-600 p-2 bg-green-50 rounded">All quotes are consistent!</p>
          ) : (
            <>
              {scanResult.issues.map((issue, i) => (
                <div key={i} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-[11px] text-yellow-800">{issue.message}</p>
                </div>
              ))}
              <button
                onClick={handleFixAll}
                disabled={fixing}
                className="w-full py-2 bg-yellow-500 text-white rounded text-xs font-medium disabled:opacity-50"
              >
                {fixing ? 'Fixing...' : `Fix All (${scanResult.totalIssues} issues)`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Writing Analysis
// =============================================================================

interface AnalysisResult {
  readingLevel: number;
  sentences: number;
  words: number;
  cliches: Array<{ phrase: string; count: number }>;
  wordFrequencies: Array<{ word: string; count: number }>;
}

function AnalyzeSection() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await callGas<AnalysisResult>('analyzeText');
      setData(res);
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-gray-500">Analyze reading level, cliches, and word frequencies.</p>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full py-2 bg-atticus-600 text-white rounded text-xs font-medium hover:bg-atticus-700 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Run Analysis'}
      </button>

      {error && <p className="text-[11px] text-red-600 p-2 bg-red-50 rounded">{error}</p>}

      {data && (
        <div className="space-y-4">
          {/* Reading Level */}
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Readability</h3>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-600">Flesch-Kincaid Grade</span>
              <span className="text-sm font-bold text-atticus-600">{data.readingLevel}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Estimated US school grade level required to understand the text.
            </p>
          </div>

          {/* Cliches */}
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Cliché Finder</h3>
            {data.cliches.length === 0 ? (
              <p className="text-[11px] text-green-600">No common clichés found.</p>
            ) : (
              <ul className="space-y-1">
                {data.cliches.map((c, i) => (
                  <li key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-700">"{c.phrase}"</span>
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded font-medium">
                      x{c.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Word Frequency */}
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Repeated Words</h3>
            <div className="space-y-1">
              {data.wordFrequencies.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-700">{w.word}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400"
                        style={{ width: `${(w.count / data.wordFrequencies[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-500 w-4 text-right">{w.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
