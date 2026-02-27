import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { callGas } from '../hooks/useGasBridge';

const TRIM_SIZES = [
  { value: '5x8', label: '5" x 8"' },
  { value: '5.25x8', label: '5.25" x 8"' },
  { value: '5.5x8.5', label: '5.5" x 8.5"' },
  { value: '6x9', label: '6" x 9" (Most Common)' },
  { value: '6.14x9.21', label: '6.14" x 9.21"' },
  { value: '6.69x9.61', label: '6.69" x 9.61"' },
  { value: '7x10', label: '7" x 10"' },
  { value: '7.44x9.69', label: '7.44" x 9.69"' },
  { value: '7.5x9.25', label: '7.5" x 9.25"' },
  { value: '8x10', label: '8" x 10"' },
  { value: '8.5x11', label: '8.5" x 11" (Letter)' },
  { value: '8.27x11.69', label: 'A4 (8.27" x 11.69")' },
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

  // Metadata Overrides
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
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
          title: title.trim() || undefined,
          author: author.trim() || undefined,
          isbn: isbn.trim() || undefined,
          publisher: publisher.trim() || undefined,
        }
      };

      const res = await callGas<ExportResult>(method, settings);
      setResult(res);
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-3 space-y-4">
      <h2 className="text-sm font-semibold text-gray-800">Export Book</h2>

      {/* Format Selector */}
      <div className="flex gap-1.5">
        {(['epub', 'pdf', 'docx'] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => { setExportFormat(fmt); setResult(null); }}
            className={`flex-1 py-2 rounded text-xs font-medium transition-colors
              ${exportFormat === fmt
                ? 'bg-atticus-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Book Metadata */}
      <div className="space-y-2 p-3 bg-gray-50 border border-gray-100 rounded">
        <h3 className="text-xs font-semibold text-gray-700">Book Metadata (Optional)</h3>
        <div>
          <input
            type="text"
            placeholder="Book Title (defaults to doc name)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 p-1.5 border rounded text-xs bg-white"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Author Name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-1.5 border rounded text-xs bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="ISBN (Optional)"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            className="w-full p-1.5 border rounded text-xs bg-white"
          />
          <input
            type="text"
            placeholder="Publisher"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="w-full p-1.5 border rounded text-xs bg-white"
          />
        </div>
      </div>

      {/* EPUB Settings */}
      {exportFormat === 'epub' && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={dropCaps}
              onChange={(e) => setDropCaps(e.target.checked)}
              className="rounded"
            />
            <span>Drop Caps (first letter of each chapter)</span>
          </label>

          <div>
            <label className="text-xs text-gray-600 block mb-1">Scene Break Symbol</label>
            <select
              value={sceneBreak}
              onChange={(e) => setSceneBreak(e.target.value)}
              className="w-full p-1.5 border rounded text-xs"
            >
              <option value="* * *">* * *</option>
              <option value="~ ~ ~">~ ~ ~</option>
              <option value="- - -">- - -</option>
              <option value={'\u2022 \u2022 \u2022'}>{'\u2022 \u2022 \u2022'}</option>
              <option value={'\u2766'}>{'\u2766'} (Floral Heart)</option>
              <option value={'\u2726'}>{'\u2726'} (Four-pointed Star)</option>
              <option value={'\u2042'}>{'\u2042'} (Asterism)</option>
            </select>
          </div>
        </div>
      )}

      {/* PDF Settings */}
      {exportFormat === 'pdf' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Trim Size</label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
              className="w-full p-1.5 border rounded text-xs"
            >
              {TRIM_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={mirrorMargins}
              onChange={(e) => setMirrorMargins(e.target.checked)}
              className="rounded"
            />
            <span>Mirror Margins (for print binding)</span>
          </label>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={orphanControl}
              onChange={(e) => setOrphanControl(e.target.checked)}
              className="rounded"
            />
            <span>Orphan/Widow Control</span>
          </label>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={dropCaps}
              onChange={(e) => setDropCaps(e.target.checked)}
              className="rounded"
            />
            <span>Drop Caps</span>
          </label>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-2.5 bg-atticus-600 text-white rounded-md text-sm font-medium
          hover:bg-atticus-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Exporting...
          </span>
        ) : (
          `Export ${exportFormat.toUpperCase()}`
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded space-y-2">
          <p className="text-xs font-medium text-green-800">Export Complete!</p>
          <p className="text-[11px] text-green-700">{result.filename}</p>
          <p className="text-[11px] text-green-600">
            {result.sizeFormatted}
            {result.pageCount ? ` | ${result.pageCount} pages` : ''}
            {result.chapterCount ? ` | ${result.chapterCount} chapters` : ''}
          </p>
          <a
            href={result.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 text-center bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
          >
            Download {exportFormat.toUpperCase()}
          </a>
          <p className="text-[10px] text-green-500">Link expires in 24 hours</p>
        </div>
      )}
    </div>
  );
}
