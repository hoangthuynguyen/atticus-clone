import { useState } from 'react';
import { callGas } from '../hooks/useGasBridge';

export function BoxSetPanel() {
    const [urlsText, setUrlsText] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
    const [result, setResult] = useState<any>(null);

    async function handleGenerate() {
        const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
        if (!urls.length) {
            setStatus({ text: 'Please enter at least one Google Docs URL.', ok: false });
            return;
        }

        setLoading(true);
        setStatus(null);
        setResult(null);

        try {
            const res = await callGas<any>('exportBoxSetEpub', {
                urls,
                includeBookTitles: true,
                metadataOverrides: { title: title || 'My Box Set' },
            });
            setResult(res);
            setStatus({ text: 'Box Set EPUB generated successfully!', ok: true });
        } catch (err) {
            setStatus({ text: `Failed: ${err instanceof Error ? err.message : String(err)}`, ok: false });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-3 space-y-4 pb-20 flex flex-col h-full overflow-y-auto">
            <div>
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-lg">📦</span> Box Set Generator
                </h2>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                    Combine multiple Google Docs into a single massive EPUB file. Paste the URLs of the books you want to include, one per line. The Add-on will automatically combine them, adjusting Table of Contents and Headings cleanly.
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Box Set Title</label>
                    <input
                        type="text"
                        placeholder="e.g. The Lord of The Rings: The Complete Trilogy"
                        className="w-full text-sm p-2 border border-gray-300 rounded focus:border-atticus-500 focus:ring-1 focus:ring-atticus-500 outline-none transition-shadow"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-xs font-semibold text-gray-700 block">Google Docs URLs</label>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{urlsText.split('\n').filter(x => x.trim()).length} documents found</span>
                    </div>
                    <textarea
                        className="w-full h-40 text-[11px] p-2.5 border border-gray-300 rounded focus:border-atticus-500 focus:ring-1 focus:ring-atticus-500 outline-none font-mono whitespace-nowrap overflow-x-auto leading-loose transition-shadow bg-gray-50 focus:bg-white"
                        placeholder="https://docs.google.com/document/d/...&#10;https://docs.google.com/document/d/...&#10;"
                        value={urlsText}
                        onChange={e => setUrlsText(e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 pl-1">Ensure the current Google account has access to these documents.</p>
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={handleGenerate}
                    disabled={loading || !urlsText.trim()}
                    className="w-full py-3 bg-atticus-600 text-white rounded-lg text-sm font-bold hover:bg-atticus-700 disabled:opacity-50 transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Building EPUB Book...
                        </>
                    ) : 'Generate Box Set EPUB'}
                </button>
            </div>

            {status && (
                <div className={`p-2.5 rounded-md text-xs font-medium border flex items-center gap-2 ${status.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <span>{status.ok ? '✅' : '❌'}</span>
                    <span>{status.text}</span>
                </div>
            )}

            {result && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3 mt-4">
                    <p className="text-xs font-bold text-green-800 text-center">Your Box Set is Ready!</p>
                    <div className="flex justify-between items-center bg-white border border-green-100 p-2.5 rounded text-[11px] text-gray-600 font-mono shadow-sm">
                        <span className="truncate mr-2 text-gray-800">{result.filename}</span>
                        <span className="flex-shrink-0 font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{result.sizeFormatted}</span>
                    </div>
                    <a
                        href={result.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full pt-1.5 pb-2 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition shadow-sm"
                    >
                        ↓ Download Box Set Now
                    </a>
                </div>
            )}
        </div>
    );
}
