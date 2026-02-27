import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface ThemePreset {
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

const API_URL = import.meta.env.VITE_API_URL || 'https://atticus-api.onrender.com';

export function ThemePanel() {
  const [themes, setThemes] = useState<ThemePreset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  async function fetchThemes() {
    try {
      const res = await fetch(`${API_URL}/themes/presets`);
      const data = await res.json();
      setThemes(data.themes || []);
    } catch {
      setStatus('Failed to load themes. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyTheme(theme: ThemePreset) {
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
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
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
    <div className="p-3 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800">Book Themes</h2>
      <p className="text-[11px] text-gray-500">17 preset themes optimized for different genres</p>

      {status && (
        <p className={`text-[11px] p-2 rounded ${status.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {status}
        </p>
      )}

      <div className="space-y-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleApplyTheme(theme)}
            disabled={applying}
            className={`w-full p-3 rounded-lg border text-left transition-all hover:shadow-sm disabled:opacity-50
              ${selectedId === theme.id
                ? 'border-atticus-500 bg-atticus-50 ring-1 ring-atticus-300'
                : 'border-gray-200 bg-white hover:border-gray-300'}`}
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
  );
}
