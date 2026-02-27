import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { callGas } from '../hooks/useGasBridge';

const TRIM_SIZES = [
  { value: '5x8',        label: '5" × 8"' },
  { value: '5.25x8',     label: '5.25" × 8"' },
  { value: '5.5x8.5',    label: '5.5" × 8.5"' },
  { value: '6x9',        label: '6" × 9"  ★ Most Common' },
  { value: '6.14x9.21',  label: '6.14" × 9.21"' },
  { value: '6.69x9.61',  label: '6.69" × 9.61"' },
  { value: '7x10',       label: '7" × 10"' },
  { value: '7.44x9.69',  label: '7.44" × 9.69"' },
  { value: '7.5x9.25',   label: '7.5" × 9.25"' },
  { value: '8x10',       label: '8" × 10"' },
  { value: '8.5x11',     label: '8.5" × 11"  Letter' },
  { value: '8.27x11.69', label: 'A4  (8.27" × 11.69")' },
];

const FORMAT_INFO: Record<string, { desc: string; ext: string; emoji: string }> = {
  epub: { desc: 'E-readers & digital stores', ext: '.epub', emoji: '📖' },
  pdf:  { desc: 'Print-ready with trim sizes', ext: '.pdf',  emoji: '🖨️' },
  docx: { desc: 'Word-compatible editing',    ext: '.docx', emoji: '📝' },
};

const SCENE_BREAKS = [
  { value: '* * *',               label: '* * *' },
  { value: '~ ~ ~',               label: '~ ~ ~' },
  { value: '\u2022 \u2022 \u2022', label: '• • •' },
  { value: '\u2766',               label: '\u2766  Floral Heart' },
  { value: '\u2726',               label: '\u2726  Four-point Star' },
  { value: '\u2042',               label: '\u2042  Asterism' },
];

interface ExportResult {
  downloadUrl: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  pageCount?: number;
  chapterCount?: number;
  trimSize?: string;
}

export function ExportPanel() {
  const {
    exportFormat, setExportFormat,
    trimSize, setTrimSize,
    isExporting, setIsExporting,
    setError,
  } = useAppStore();

  const [result, setResult] = useState<ExportResult | null>(null);
  const [dropCaps, setDropCaps] = useState(false);
  const [sceneBreak, setSceneBreak] = useState('* * *');
  const [mirrorMargins, setMirrorMargins] = useState(true);
  const [orphanControl, setOrphanControl] = useState(true);

  const [title, setTitle]         = useState('');
  const [author, setAuthor]       = useState('');
  const [isbn, setIsbn]           = useState('');
  const [publisher, setPublisher] = useState('');

  async function handleExport() {
    setIsExporting(true);
    setResult(null);
    setError(null);

    try {
      const methodMap = { epub: 'exportEpub', pdf: 'exportPdf', docx: 'exportDocx' };
      const method = methodMap[exportFormat];

      const settings = {
        theme: {},
        dropCaps,
        sceneBreakSymbol: sceneBreak,
        trimSize,
        mirrorMargins,
        orphanControl,
        metadataOverrides: {
          title:     title.trim()     || undefined,
          author:    author.trim()    || undefined,
          isbn:      isbn.trim()      || undefined,
          publisher: publisher.trim() || undefined,
        },
      };

      const res = await callGas<ExportResult>(method, settings);
      setResult(res);
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }

  const info = FORMAT_INFO[exportFormat];

  return (
    <div className="p-3 space-y-3 pb-20">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">Export Book</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Generate a publish-ready file from your document</p>
      </div>

      {/* Format selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {(['epub', 'pdf', 'docx'] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => { setExportFormat(fmt); setResult(null); }}
            className={`py-2.5 rounded-lg text-xs font-bold border-2 transition-all flex flex-col items-center gap-0.5
              ${exportFormat === fmt
                ? 'border-atticus-600 bg-atticus-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
          >
            <span className="text-base">{FORMAT_INFO[fmt].emoji}</span>
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-500">
        {info.desc}
        <span className="ml-1 font-mono text-gray-400">{info.ext}</span>
      </p>

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
            className="w-full p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-atticus-400"
          />
          <input
            type="text"
            placeholder="Author Name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-atticus-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-atticus-400"
            />
            <input
              type="text"
              placeholder="Publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="p-2 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-atticus-400"
            />
          </div>
        </div>
      </details>

      {/* EPUB Settings */}
      {exportFormat === 'epub' && (
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
        </div>
      )}

      {/* PDF Settings */}
      {exportFormat === 'pdf' && (
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
          <div className="space-y-1.5">
            {([
              { label: 'Mirror margins (for binding)', value: mirrorMargins, set: setMirrorMargins },
              { label: 'Orphan/widow control',         value: orphanControl, set: setOrphanControl },
              { label: 'Drop caps',                    value: dropCaps,      set: setDropCaps },
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
        disabled={isExporting}
        className="w-full py-3 bg-atticus-600 text-white rounded-lg text-sm font-semibold
          hover:bg-atticus-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed
          transition-all shadow-sm"
      >
        {isExporting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating {exportFormat.toUpperCase()}…
          </span>
        ) : (
          `Export ${exportFormat.toUpperCase()}`
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center flex-shrink-0">✓</span>
            <p className="text-xs font-semibold text-green-800">Export complete!</p>
          </div>
          <div className="text-[11px] text-green-700 space-y-0.5">
            <p className="font-mono text-[10px] truncate text-gray-500">{result.filename}</p>
            <p>
              {result.sizeFormatted}
              {result.pageCount    ? ` · ${result.pageCount} pages` : ''}
              {result.chapterCount ? ` · ${result.chapterCount} chapters` : ''}
            </p>
          </div>
          <a
            href={result.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2
              bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 transition-colors"
          >
            ↓ Download {exportFormat.toUpperCase()}
          </a>
          <p className="text-[10px] text-green-400 text-center">Link expires in 24 hours</p>
        </div>
      )}
    </div>
  );
}
