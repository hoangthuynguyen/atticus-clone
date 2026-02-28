import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

const FONTS = ['Georgia', 'EB Garamond', 'Merriweather', 'Lora', 'PT Serif', 'Crimson Text', 'Roboto', 'Open Sans', 'Lato', 'Cinzel', 'Great Vibes', 'Oswald', 'Montserrat', 'Playfair Display'];
const SIZES = ['10pt', '10.5pt', '11pt', '11.5pt', '12pt', '13pt', '14pt'];

interface ThemePresetI {
  id: string;
  name: string;
  genre: string;
  bodyFont: string;
  headingFont: string;
  fontSize: string;
  lineHeight: number;
  colorAccent: string;
  dropCaps: boolean;
  sceneBreakSymbol: string;
}

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || 'https://bookify-api.onrender.com';

export function ThemePanel() {
  const [themes, setThemes] = useState<ThemePresetI[]>([]);
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  const [customTheme, setCustomTheme] = useState({
    name: 'Custom Theme',
    bodyFont: 'Georgia',
    headingFont: 'Georgia',
    fontSize: '11pt',
    lineHeight: 1.6,
    colorAccent: '#333333',
    dropCaps: false,
    sceneBreakSymbol: '* * *',
  });

  useEffect(() => { fetchThemes(); }, []);

  async function fetchThemes() {
    try {
      const res = await fetch(`${API_URL}/themes/presets`);
      const data = await res.json();
      setThemes(data.themes || []);
    } catch {
      setStatus({ text: 'Failed to load themes. Using offline mode.', ok: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyTheme(theme: ThemePresetI) {
    setApplying(true);
    setStatus(null);
    try {
      await callGas('applyTheme', {
        name: theme.name,
        bodyFont: theme.bodyFont,
        headingFont: theme.headingFont,
        fontSize: theme.fontSize,
        lineHeight: theme.lineHeight,
        colorAccent: theme.colorAccent,
      });
      setSelectedId(theme.id);
      setStatus({ text: `Theme "${theme.name}" applied!`, ok: true });
    } catch (err) {
      setStatus({ text: `Error: ${err instanceof Error ? err.message : String(err)}`, ok: false });
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        <div className="section-heading mb-2">Book Themes</div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-white">
        <h2 className="section-heading mb-0.5">Book Themes</h2>
        <p className="section-desc mb-2">Style your book with professional typography</p>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setTab('presets')}
            className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
              ${tab === 'presets' ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🎨 Presets
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
              ${tab === 'custom' ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ⚙️ Custom
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mx-3 mt-2 px-2.5 py-2 rounded-xl text-[11px] flex items-center gap-2 animate-slide-down
          ${status.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          <span className={`w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold ${status.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>{status.ok ? '✓' : '!'}</span>
          <span className="flex-1">{status.text}</span>
          <button onClick={() => setStatus(null)} className="text-gray-300 hover:text-gray-500 text-sm font-bold">×</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-20">
        {tab === 'presets' && (
          <>
            {themes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500">No themes loaded.</p>
                <p className="text-[11px] text-gray-400 mt-1">Check your API connection.</p>
                <button onClick={fetchThemes} className="mt-3 text-xs text-bookify-600 hover:underline">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-gray-400">{themes.length} preset themes for different genres</p>
                <div className="space-y-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleApplyTheme(theme)}
                      disabled={applying}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all hover:shadow-card-hover disabled:opacity-50 group
                        ${selectedId === theme.id
                          ? 'border-bookify-400 bg-bookify-50/50 ring-1 ring-bookify-200'
                          : 'border-gray-100 bg-white hover:border-bookify-200'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-800 truncate">{theme.name}</p>
                            {selectedId === theme.id && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-bookify-100 text-bookify-700 rounded-full font-medium flex-shrink-0">
                                Applied
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{theme.genre}</p>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colorAccent }}
                        />
                      </div>

                      {/* Font info */}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
                        <span>{theme.bodyFont}</span>
                        <span>{theme.fontSize}</span>
                        <span>{theme.lineHeight}× spacing</span>
                        {theme.dropCaps && <span className="text-bookify-500">Drop caps</span>}
                      </div>

                      {/* Mini preview */}
                      <div
                        className="mt-2 p-2 bg-gray-50 rounded text-[10px] leading-relaxed border border-gray-100"
                        style={{ fontFamily: `"${theme.bodyFont}", serif` }}
                      >
                        <p style={{ color: theme.colorAccent, fontWeight: 700, fontSize: '11px', textAlign: 'center', letterSpacing: '0.05em' }}>
                          Chapter One
                        </p>
                        <p className="mt-1 text-gray-600 line-clamp-2">
                          The morning sun cast long shadows as she walked down the cobblestone path...
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'custom' && (
          <div className="space-y-3">
            {/* Live Preview */}
            <div
              className="p-3 rounded-lg border border-gray-200"
              style={{
                fontFamily: `"${customTheme.bodyFont}", serif`,
                lineHeight: customTheme.lineHeight,
              }}
            >
              <p style={{ color: customTheme.colorAccent, fontFamily: `"${customTheme.headingFont}", serif`, fontWeight: 700, textAlign: 'center', fontSize: '13px', marginBottom: '6px' }}>
                Chapter One
              </p>
              <p className="text-gray-600 text-[11px]">
                The quick brown fox jumps over the lazy dog. In the beginning there was darkness and silence across the land.
              </p>
            </div>

            {/* Body Font */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Body Font</label>
              <select
                value={customTheme.bodyFont}
                onChange={e => setCustomTheme({ ...customTheme, bodyFont: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Heading Font */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Heading Font</label>
              <select
                value={customTheme.headingFont}
                onChange={e => setCustomTheme({ ...customTheme, headingFont: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Size + Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Size</label>
                <select
                  value={customTheme.fontSize}
                  onChange={e => setCustomTheme({ ...customTheme, fontSize: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Spacing</label>
                <select
                  value={customTheme.lineHeight}
                  onChange={e => setCustomTheme({ ...customTheme, lineHeight: Number(e.target.value) })}
                  className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
                >
                  <option value={1.2}>1.2×</option>
                  <option value={1.4}>1.4×</option>
                  <option value={1.5}>1.5×</option>
                  <option value={1.6}>1.6×</option>
                  <option value={1.8}>1.8×</option>
                </select>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Accent Color</label>
              <div className="flex gap-2 mt-1 items-center">
                <input
                  type="color"
                  value={customTheme.colorAccent}
                  onChange={e => setCustomTheme({ ...customTheme, colorAccent: e.target.value })}
                  className="h-8 w-10 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={customTheme.colorAccent}
                  onChange={e => setCustomTheme({ ...customTheme, colorAccent: e.target.value })}
                  className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-bookify-400"
                  placeholder="#333333"
                />
              </div>
            </div>

            <button
              onClick={() => handleApplyTheme(customTheme as ThemePresetI)}
              disabled={applying}
              className="btn-primary"
            >
              {applying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying...
                </>
              ) : 'Apply to Document'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
