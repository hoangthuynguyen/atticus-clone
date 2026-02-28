import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { callGas } from '../hooks/useGasBridge';

const TRIM_SIZES = [
  { value: '5x8', label: '5″ × 8″' },
  { value: '5.06x7.81', label: '5.06″ × 7.81″  B-Format' },
  { value: '5.25x8', label: '5.25″ × 8″' },
  { value: '5.5x8.5', label: '5.5″ × 8.5″  Digest' },
  { value: '6x9', label: '6″ × 9″  ★ US Trade' },
  { value: '6.14x9.21', label: '6.14″ × 9.21″  Royal' },
  { value: '6.69x9.61', label: '6.69″ × 9.61″  Pinched Crown' },
  { value: '7x10', label: '7″ × 10″  Workbook' },
  { value: '7.44x9.69', label: '7.44″ × 9.69″  Crown Quarto' },
  { value: '8x10', label: '8″ × 10″  Picture Book' },
  { value: '8.5x11', label: '8.5″ × 11″  US Letter' },
  { value: '8.27x11.69', label: 'A4 (8.27″ × 11.69″)' },
];

const FORMAT_INFO: Record<string, { desc: string; ext: string; color: string; gradient: string }> = {
  epub: { desc: 'E-readers & stores', ext: '.epub', color: 'text-violet-600', gradient: 'from-violet-500 to-purple-600' },
  pdf: { desc: 'Print-ready', ext: '.pdf', color: 'text-rose-600', gradient: 'from-rose-500 to-pink-600' },
  docx: { desc: 'Word format', ext: '.docx', color: 'text-blue-600', gradient: 'from-blue-500 to-cyan-600' },
  md: { desc: 'Blog & web', ext: '.md', color: 'text-gray-600', gradient: 'from-gray-500 to-slate-600' },
  txt: { desc: 'Plain text', ext: '.txt', color: 'text-amber-600', gradient: 'from-amber-500 to-orange-600' },
  html: { desc: 'Web page', ext: '.html', color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
};

const SCENE_BREAKS = [
  { value: '* * *', label: '* * *' },
  { value: '~ ~ ~', label: '~ ~ ~' },
  { value: '\u2022 \u2022 \u2022', label: '• • •' },
  { value: '\u2766', label: '❦  Floral Heart' },
  { value: '\u2726', label: '✦  Star' },
  { value: '\u2042', label: '⁂  Asterism' },
];

interface ExportResult {
  downloadUrl: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  pageCount?: number;
  chapterCount?: number;
  trimSize?: string;
  format?: string;
}

export function ExportPanel() {
  const {
    exportFormats, toggleExportFormat,
    trimSize, setTrimSize,
    isExporting, setIsExporting,
    setError,
  } = useAppStore();

  const [results, setResults] = useState<Record<string, ExportResult>>({});
  const [dropCaps, setDropCaps] = useState(false);
  const [sceneBreak, setSceneBreak] = useState('* * *');
  const [mirrorMargins, setMirrorMargins] = useState(true);
  const [orphanControl, setOrphanControl] = useState(true);
  const [platform, setPlatform] = useState('generic');
  const [runningHeader, setRunningHeader] = useState('none');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');

  // Spine Calculator
  const [spinePages, setSpinePages] = useState('');
  const [spinePaper, setSpinePaper] = useState('cream');
  const [spineResult, setSpineResult] = useState<{ spineWidth: number; spineWidthMm: number } | null>(null);

  // Preflight
  const [preflightWarnings, setPreflightWarnings] = useState<any[]>([]);
  const [runningPreflight, setRunningPreflight] = useState(false);

  async function handleExport() {
    if (exportFormats.length === 0) return setError('Select at least one format.');
    setIsExporting(true);
    setResults({});
    setError(null);

    try {
      const methodMap: Record<string, string> = {
        epub: 'exportEpub', pdf: 'exportPdf', docx: 'exportDocx',
        txt: 'exportTxt', html: 'exportHtml', md: 'exportMarkdown',
      };

      const settings = {
        theme: {}, dropCaps, sceneBreakSymbol: sceneBreak,
        trimSize, mirrorMargins, orphanControl, platform, runningHeader,
        metadataOverrides: {
          title: title.trim() || undefined,
          author: author.trim() || undefined,
          isbn: isbn.trim() || undefined,
          publisher: publisher.trim() || undefined,
        },
      };

      const newResults: Record<string, ExportResult> = {};
      for (const fmt of exportFormats) {
        const method = methodMap[fmt];
        if (method) {
          try {
            const res = await callGas<ExportResult>(method, settings);
            newResults[fmt] = { ...res, format: fmt };
            setResults({ ...newResults });
          } catch (err) {
            setError(`${fmt.toUpperCase()} failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePreflight() {
    setRunningPreflight(true);
    setPreflightWarnings([]);
    try {
      const warnings = await callGas<any[]>('runPreflightCheck', { platform });
      setPreflightWarnings(warnings?.length ? warnings : [{ level: 'success', message: 'All checks passed! Ready for print.' }]);
    } catch (e) {
      setPreflightWarnings([{ level: 'error', message: 'Check failed: ' + String(e) }]);
    } finally {
      setRunningPreflight(false);
    }
  }

  function calcSpine() {
    const pages = parseInt(spinePages);
    if (!pages || pages < 1) return;
    // Client-side calculation (same formula as addon)
    const ppiMap: Record<string, number> = { cream: 0.0025, white: 0.002252, groundwood: 0.0035, heavy: 0.003 };
    const ppi = ppiMap[spinePaper] || 0.0025;
    const spineInches = (pages * ppi) + 0.06;
    setSpineResult({
      spineWidth: Math.round(spineInches * 1000) / 1000,
      spineWidthMm: Math.round(spineInches * 25.4 * 10) / 10,
    });
  }

  return (
    <div className="p-3 space-y-3 pb-20 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="section-heading">Export Book</h2>
        <p className="section-desc">Generate publish-ready files from your document</p>
      </div>

      {/* ─── Format Selector ─── */}
      <div className="grid grid-cols-3 gap-1.5">
        {Object.entries(FORMAT_INFO).map(([fmt, info]) => {
          const isSelected = exportFormats.includes(fmt);
          return (
            <button
              key={fmt}
              onClick={() => { toggleExportFormat(fmt); setResults({}); }}
              className={`py-2.5 rounded-xl text-[11px] font-bold border-2 transition-all duration-200 flex flex-col items-center gap-0.5
                ${isSelected
                  ? `border-transparent bg-gradient-to-r ${info.gradient} text-white shadow-md scale-[1.02]`
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:shadow-sm'}`}
            >
              <span className="text-[13px] font-extrabold">{fmt.toUpperCase()}</span>
              <span className={`text-[9px] font-normal ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>{info.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Metadata ─── */}
      <details className="group card-section !p-0 overflow-hidden">
        <summary className="cursor-pointer text-xs font-semibold text-gray-600 flex items-center gap-2 select-none list-none p-3 hover:bg-gray-50 transition-colors">
          <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
          Book Metadata
          <span className="font-normal text-gray-300 text-[10px]">optional</span>
        </summary>
        <div className="p-3 pt-0 space-y-2 border-t border-gray-50">
          <input type="text" placeholder="Title (defaults to doc name)" value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
          <input type="text" placeholder="Author Name" value={author} onChange={e => setAuthor(e.target.value)} className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="ISBN" value={isbn} onChange={e => setIsbn(e.target.value)} className="input-field" />
            <input type="text" placeholder="Publisher" value={publisher} onChange={e => setPublisher(e.target.value)} className="input-field" />
          </div>
        </div>
      </details>

      {/* ─── EPUB Options ─── */}
      {exportFormats.includes('epub') && (
        <div className="card-section space-y-2.5 border-l-[3px] border-l-violet-400 animate-slide-up">
          <p className="section-title text-violet-500">EPUB Options</p>
          <ToggleRow label="Drop caps at chapter start" checked={dropCaps} onChange={setDropCaps} />
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Scene break symbol</label>
            <select value={sceneBreak} onChange={e => setSceneBreak(e.target.value)} className="select-field">
              {SCENE_BREAKS.map(sb => <option key={sb.value} value={sb.value}>{sb.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Platform store links</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="select-field">
              <option value="generic">Generic (Books2Read)</option>
              <option value="amazon">Amazon Kindle</option>
              <option value="apple">Apple Books</option>
              <option value="kobo">Kobo</option>
            </select>
          </div>
        </div>
      )}

      {/* ─── PDF / Print Options ─── */}
      {exportFormats.includes('pdf') && (
        <div className="card-section space-y-2.5 border-l-[3px] border-l-rose-400 animate-slide-up">
          <p className="section-title text-rose-500">Print Settings</p>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Trim size</label>
            <select value={trimSize} onChange={e => setTrimSize(e.target.value)} className="select-field">
              {TRIM_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Running headers</label>
            <select value={runningHeader} onChange={e => setRunningHeader(e.target.value)} className="select-field">
              <option value="none">None</option>
              <option value="author_title">Author (Left) & Title (Right)</option>
              <option value="chapter_title">Chapter Title</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <ToggleRow label="Mirror margins (binding)" checked={mirrorMargins} onChange={setMirrorMargins} />
            <ToggleRow label="Orphan/widow control" checked={orphanControl} onChange={setOrphanControl} />
            <ToggleRow label="Drop caps" checked={dropCaps} onChange={setDropCaps} />
          </div>
        </div>
      )}

      {/* ─── Spine Width Calculator ─── */}
      {exportFormats.includes('pdf') && (
        <details className="group card-section !p-0 overflow-hidden animate-slide-up">
          <summary className="cursor-pointer text-xs font-semibold text-gray-600 flex items-center gap-2 select-none list-none p-3 hover:bg-gray-50 transition-colors">
            <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
            📐 Spine Width Calculator
          </summary>
          <div className="p-3 pt-0 space-y-2 border-t border-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Page count</label>
                <input type="number" placeholder="e.g. 300" value={spinePages} onChange={e => setSpinePages(e.target.value)} className="input-field" min="1" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Paper type</label>
                <select value={spinePaper} onChange={e => setSpinePaper(e.target.value)} className="select-field">
                  <option value="cream">Cream / Natural</option>
                  <option value="white">White (50lb)</option>
                  <option value="groundwood">Groundwood</option>
                  <option value="heavy">Heavy Cream</option>
                </select>
              </div>
            </div>
            <button onClick={calcSpine} className="btn-secondary w-full">Calculate</button>
            {spineResult && (
              <div className="p-2.5 bg-gradient-to-r from-bookify-50 to-violet-50 rounded-lg text-center animate-scale-in">
                <p className="text-xl font-bold text-bookify-700">{spineResult.spineWidth}″</p>
                <p className="text-[11px] text-gray-500">{spineResult.spineWidthMm} mm</p>
              </div>
            )}
          </div>
        </details>
      )}

      {/* ─── Pre-flight ─── */}
      <div className="card-section space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <span className="text-sm">🩺</span> Pre-flight Check
            </p>
            <p className="text-[10px] text-gray-400">Scan for print & distribution issues</p>
          </div>
          <button onClick={handlePreflight} disabled={runningPreflight} className="btn-secondary">
            {runningPreflight ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Scanning…
              </span>
            ) : 'Run Checks'}
          </button>
        </div>
        {preflightWarnings.length > 0 && (
          <div className="space-y-1 animate-slide-up">
            {preflightWarnings.map((w, i) => (
              <div key={i} className={`p-2 rounded-lg text-[10px] font-medium border ${w.level === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  w.level === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                <span className="mr-1.5">{w.level === 'error' ? '❌' : w.level === 'warning' ? '⚠️' : '✅'}</span>
                {w.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Export Button ─── */}
      <button onClick={handleExport} disabled={isExporting || exportFormats.length === 0} className="btn-primary !py-3 !text-sm !rounded-xl">
        {isExporting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Files…
          </>
        ) : (
          <>
            Export {exportFormats.length} Format{exportFormats.length !== 1 ? 's' : ''}
          </>
        )}
      </button>

      {/* ─── Results ─── */}
      {Object.values(results).length > 0 && (
        <div className="space-y-2 animate-slide-up">
          <p className="section-title">Export Results</p>
          {Object.entries(results).map(([fmt, result]) => (
            <div key={fmt} className="card-section border-l-[3px] border-l-emerald-400">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">✓</span>
                <p className="text-xs font-semibold text-gray-800">{fmt.toUpperCase()}</p>
              </div>
              <p className="text-[10px] text-gray-400 font-mono truncate mb-1.5">{result.filename}</p>
              <p className="text-[11px] text-gray-600 mb-2">
                {result.sizeFormatted}
                {result.pageCount ? ` · ${result.pageCount} pages` : ''}
                {result.chapterCount ? ` · ${result.chapterCount} chapters` : ''}
              </p>
              <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm">
                ↓ Download {fmt.toUpperCase()}
              </a>
            </div>
          ))}
          <p className="text-[10px] text-gray-300 text-center">Links expire in 24 hours</p>
        </div>
      )}
    </div>
  );
}

/* ─── Toggle Row Component ─── */
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer group py-0.5">
      <span className="text-[11px] text-gray-600 group-hover:text-gray-800 transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`toggle-switch ${checked ? 'bg-bookify-600' : 'bg-gray-200'}`}
      >
        <span className={`toggle-switch-knob ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}
