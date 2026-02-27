import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

const FONTS = ['Georgia', 'EB Garamond', 'Merriweather', 'Lora', 'PT Serif', 'Crimson Text', 'Roboto', 'Open Sans', 'Lato'];
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

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || 'https://atticus-api.onrender.com';

export function ThemePanel() {
  const [themes, setThemes] = useState<ThemePresetI[]>([]);
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Custom Theme State
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

  useEffect(() => {
    fetchThemes();
  }, []);

  async function fetchThemes() {
    try {
      const res = await fetch(`${API_URL} /themes/presets`);
      const data = await res.json();
      setThemes(data.themes || []);
    } catch {
      setStatus('Failed to load themes. Check your connection.');
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
      setStatus(`Theme "${theme.name}" applied!`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)} `);
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">Themes</h2>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-800">Book Themes</h2>
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => setTab('presets')}
          className={`flex - 1 px - 2 py - 1.5 rounded text - [11px] font - medium transition - colors
            ${tab === 'presets' ? 'bg-atticus-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} `}
        >
          Preset Themes
        </button>
        <button
          onClick={() => setTab('custom')}
          className={`flex - 1 px - 2 py - 1.5 rounded text - [11px] font - medium transition - colors
            ${tab === 'custom' ? 'bg-atticus-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} `}
        >
          Custom Builder
        </button>
      </div>

      {status && (
        <p className={`text - [11px] p - 2 rounded ${status.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} `}>
          {status}
        </p>
      )}

      {tab === 'presets' && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">17 preset themes optimized for different genres</p>
          <div className="space-y-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleApplyTheme(theme)}
                disabled={applying}
                className={`w - full p - 3 rounded - lg border text - left transition - all hover: shadow - sm disabled: opacity - 50
              ${selectedId === theme.id
                    ? 'border-atticus-500 bg-atticus-50 ring-1 ring-atticus-300'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  } `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">{theme.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{theme.genre}</p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: theme.colorAccent }}
                  />
                </div>
                <div className="mt-1.5 flex gap-3 text-[10px] text-gray-400">
                  <span>{theme.bodyFont}</span>
                  <span>{theme.fontSize}</span>
                  <span>{theme.lineHeight}x</span>
                  {theme.dropCaps && <span>Drop Caps</span>}
                </div>
                {/* Mini preview */}
                <div
                  className="mt-2 p-2 bg-gray-50 rounded text-[10px] leading-relaxed"
                  style={{ fontFamily: `"${theme.bodyFont}", serif` }}
                >
                  <p style={{ color: theme.colorAccent, fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
                    Chapter One
                  </p>
                  <p className="mt-1 text-gray-600">
                    The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet...
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'custom' && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-gray-600 uppercase">Body Font</label>
            <select
              value={customTheme.bodyFont}
              onChange={e => setCustomTheme({ ...customTheme, bodyFont: e.target.value })}
              className="w-full mt-1 p-2 bg-gray-50 border rounded text-xs"
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-600 uppercase">Heading Font</label>
            <select
              value={customTheme.headingFont}
              onChange={e => setCustomTheme({ ...customTheme, headingFont: e.target.value })}
              className="w-full mt-1 p-2 bg-gray-50 border rounded text-xs"
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-600 uppercase">Size</label>
              <select
                value={customTheme.fontSize}
                onChange={e => setCustomTheme({ ...customTheme, fontSize: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-50 border rounded text-xs"
              >
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 uppercase">Spacing</label>
              <select
                value={customTheme.lineHeight}
                onChange={e => setCustomTheme({ ...customTheme, lineHeight: Number(e.target.value) })}
                className="w-full mt-1 p-2 bg-gray-50 border rounded text-xs"
              >
                <option value={1.2}>1.2x</option>
                <option value={1.4}>1.4x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.6}>1.6x</option>
                <option value={1.8}>1.8x</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-600 uppercase">Accent Color</label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={customTheme.colorAccent}
                onChange={e => setCustomTheme({ ...customTheme, colorAccent: e.target.value })}
                className="h-8 w-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customTheme.colorAccent}
                onChange={e => setCustomTheme({ ...customTheme, colorAccent: e.target.value })}
                className="flex-1 p-2 bg-gray-50 border rounded text-xs"
              />
            </div>
          </div>

          <button
            onClick={() => handleApplyTheme(customTheme as any)}
            disabled={applying}
            className="w-full py-2.5 bg-atticus-600 text-white rounded-lg text-sm font-medium hover:bg-atticus-700 disabled:opacity-50 transition-colors"
          >
            Apply Custom Theme
          </button>
        </div>
      )}
    </div>
  );
}
