import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { callGas } from '../hooks/useGasBridge';

const TRIM_SIZES = [
  { value: '5x8', label: '5" × 8"' },
  { value: '5.06x7.81', label: '5.06" × 7.81"  (B-Format)' },
  { value: '5.25x8', label: '5.25" × 8"' },
  { value: '5.5x8.5', label: '5.5" × 8.5"  (Digest)' },
  { value: '6x9', label: '6" × 9"  ★ Most Common (US Trade)' },
  { value: '6.14x9.21', label: '6.14" × 9.21"  (Royal)' },
  { value: '6.69x9.61', label: '6.69" × 9.61"  (Pinched Crown)' },
  { value: '7x10', label: '7" × 10"  ★ Good for Workbooks' },
  { value: '7.44x9.69', label: '7.44" × 9.69"  (Crown Quarto)' },
  { value: '7.5x9.25', label: '7.5" × 9.25"' },
  { value: '8x10', label: '8" × 10"  ★ Good for Picture Books' },
  { value: '8.25x6', label: '8.25" × 6"  (Landscape)' },
  { value: '8.25x8.25', label: '8.25" × 8.25"  (Square)' },
  { value: '8.5x8.5', label: '8.5" × 8.5"  (Square)' },
  { value: '8.5x11', label: '8.5" × 11"  (US Letter)' },
  { value: '8.27x11.69', label: 'A4  (8.27" × 11.69")' },
];

const FORMAT_INFO: Record<string, { desc: string; ext: string; emoji: string }> = {
  epub: { desc: 'E-readers & digital stores', ext: '.epub', emoji: '📖' },
  pdf: { desc: 'Print-ready with trim sizes', ext: '.pdf', emoji: '🖨️' },
  docx: { desc: 'Word-compatible editing', ext: '.docx', emoji: '📝' },
  txt: { desc: 'Plain text format', ext: '.txt', emoji: '📄' },
  html: { desc: 'Web page format', ext: '.html', emoji: '🌐' },
};

const SCENE_BREAKS = [
  { value: '* * *', label: '* * *' },
  { value: '~ ~ ~', label: '~ ~ ~' },
  { value: '\u2022 \u2022 \u2022', label: '• • •' },
  { value: '\u2766', label: '\u2766  Floral Heart' },
  { value: '\u2726', label: '\u2726  Four-point Star' },
  { value: '\u2042', label: '\u2042  Asterism' },
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

  async function handleExport() {
    if (exportFormats.length === 0) return setError('Please select at least one format.');
    setIsExporting(true);
    setResults({});
    setError(null);

    try {
      const methodMap: Record<string, string> = {
        epub: 'exportEpub',
        pdf: 'exportPdf',
        docx: 'exportDocx',
        txt: 'exportTxt',
        html: 'exportHtml'
      };

      const settings = {
        theme: {},
        dropCaps,
        sceneBreakSymbol: sceneBreak,
        trimSize,
        mirrorMargins,
        orphanControl,
        platform,
        runningHeader,
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
            setResults({ ...newResults }); // Incremental UI update
          } catch (err) {
            console.error(`Export failed for ${fmt}:`, err);
            const errMsg = `Failed for ${fmt.toUpperCase()}: ${err instanceof Error ? err.message : String(err)}`;
            // We can't use callback on setError, so we'll just set it directly or use local state for multiple errors. 
            // For now, we'll just set the last error.
            setError(errMsg);
          }
        }
      }
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-3 space-y-3 pb-20">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">Export Book</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Generate a publish-ready file from your document</p>
      </div>

      {/* Format selector */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 mb-2">
        {(Object.keys(FORMAT_INFO)).map((fmt) => {
          const isSelected = exportFormats.includes(fmt);
          return (
            <button
              key={fmt}
              onClick={() => { toggleExportFormat(fmt); setResults({}); }}
              className={`py-2 rounded-lg text-xs font-bold border-2 transition-all flex flex-col items-center gap-0.5
                ${isSelected
                  ? 'border-bookify-600 bg-bookify-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              <div className="flex gap-1.5 items-center">
                <span className="text-base">{FORMAT_INFO[fmt].emoji}</span>
                {fmt.toUpperCase()}
              </div>
            </button>
          );
        })}
      </div>
      {exportFormats.length > 0 && (
        <div className="text-[11px] text-gray-500 mb-3 space-y-0.5">
          {exportFormats.map(fmt => (
            <div key={fmt} className="flex gap-2">
              <span className="font-mono text-gray-400 w-10">{FORMAT_INFO[fmt].ext}</span>
              <span>{FORMAT_INFO[fmt].desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Metadata (collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-semibold text-gray-600 flex items-center gap-1 select-none list-none py-1">
          <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
          Book Metadata
          <span className="font-normal text-gray-400 text-[11px]">(optional)</span>
        </summary>
        <div className="mt-2 space-y-2">
          <input
            type="text"
            placeholder="Title (defaults to document name)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bookify-400"
          />
          <input
            type="text"
            placeholder="Author Name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bookify-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bookify-400"
            />
            <input
              type="text"
              placeholder="Publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bookify-400"
            />
          </div>
        </div>
      </details>

      {/* EPUB Settings */}
      {exportFormats.includes('epub') && (
        <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg space-y-2">
          <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide">EPUB Options</p>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={dropCaps}
              onChange={(e) => setDropCaps(e.target.checked)}
              className="rounded accent-purple-600"
            />
            <span className="text-gray-700">Drop caps at each chapter start</span>
          </label>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Scene break symbol</label>
            <select
              value={sceneBreak}
              onChange={(e) => setSceneBreak(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              {SCENE_BREAKS.map((sb) => (
                <option key={sb.value} value={sb.value}>{sb.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Platform Store Links</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="generic">Generic (Books2Read)</option>
              <option value="amazon">Amazon Kindle Store</option>
              <option value="apple">Apple Books Store</option>
              <option value="kobo">Kobo Store</option>
            </select>
          </div>
        </div>
      )}

      {/* PDF Settings */}
      {exportFormats.includes('pdf') && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
          <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide">Print Settings</p>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Trim size</label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
            >
              {TRIM_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Running Headers</label>
            <select
              value={runningHeader}
              onChange={(e) => setRunningHeader(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
            >
              <option value="none">None</option>
              <option value="author_title">Author (Left) & Title (Right)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            {([
              { label: 'Mirror margins (for binding)', value: mirrorMargins, set: setMirrorMargins },
              { label: 'Orphan/widow control', value: orphanControl, set: setOrphanControl },
              { label: 'Drop caps', value: dropCaps, set: setDropCaps },
            ] as const).map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  className="rounded accent-red-600"
                />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || exportFormats.length === 0}
        className="w-full py-3 bg-bookify-600 text-white rounded-lg text-sm font-semibold
          hover:bg-bookify-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed
          transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
      >
        {isExporting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Files…
          </>
        ) : (
          `Export ${exportFormats.length} Format${exportFormats.length !== 1 ? 's' : ''}`
        )}
      </button>

      {/* Result */}
      {Object.values(results).length > 0 && (
        <div className="space-y-2 mt-4">
          <h3 className="text-xs font-semibold text-gray-800">Export Results:</h3>
          {Object.entries(results).map(([fmt, result]) => (
            <div key={fmt} className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">✓</span>
                <p className="text-xs font-semibold text-green-800">{fmt.toUpperCase()} export complete!</p>
              </div>
              <div className="text-[11px] text-green-700 space-y-0.5 ml-6">
                <p className="font-mono text-[10px] truncate text-gray-500">{result.filename}</p>
                <p>
                  {result.sizeFormatted}
                  {result.pageCount ? ` · ${result.pageCount} pages` : ''}
                  {result.chapterCount ? ` · ${result.chapterCount} chapters` : ''}
                </p>
              </div>
              <a
                href={result.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-1.5
                  bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 transition-colors"
                title={`Download ${fmt.toUpperCase()}`}
              >
                ↓ Download {fmt.toUpperCase()}
              </a>
            </div>
          ))}
          <p className="text-[10px] text-green-400 text-center mt-2">Links expire in 24 hours</p>
        </div>
      )}
    </div>
  );
}
