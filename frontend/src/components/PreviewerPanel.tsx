import { useState } from 'react';
import { callGas } from '../hooks/useGasBridge';

import { DEVICES, CATEGORY_LABELS, THEME_PRESETS } from '../data/previewConfig';

// =============================================================================
// PreviewerPanel Component
// =============================================================================

export function PreviewerPanel() {
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [previewFontSize, setPreviewFontSize] = useState(14);
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('eink');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showMargins, setShowMargins] = useState(true);

  // Fetch actual document content for preview
  const loadPreviewContent = async () => {
    setLoadingContent(true);
    try {
      const result = await callGas<{ html: string }>('getDocumentContent');
      if (result?.html) {
        setPreviewContent(result.html);
      }
    } catch {
      // Silently fail — use sample text
    } finally {
      setLoadingContent(false);
    }
  };

  // Device dimensions for viewport
  const deviceW = orientation === 'portrait' ? selectedDevice.width : selectedDevice.height;
  const deviceH = orientation === 'portrait' ? selectedDevice.height : selectedDevice.width;

  // Scale to fit in the sidebar (max ~310px wide)
  const maxWidth = 310;
  const maxHeight = 420;
  const scaleW = maxWidth / deviceW;
  const scaleH = maxHeight / deviceH;
  const scale = Math.min(scaleW, scaleH, 2.5); // cap at 2.5x zoom

  const margins = showMargins
    ? selectedDevice.category === 'print'
      ? { top: 20, right: 16, bottom: 20, left: 18 }
      : { top: 10, right: 8, bottom: 10, left: 8 }
    : { top: 4, right: 4, bottom: 4, left: 4 };

  const previewStyles: React.CSSProperties = {
    width: `${deviceW}mm`,
    height: `${deviceH}mm`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    fontSize: `${previewFontSize}px`,
    ...selectedDevice.css,
    fontFamily: selectedTheme.bodyFont,
    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
    background: selectedDevice.eink ? '#f5f0e8' : selectedTheme.bodyBg,
    color: selectedDevice.eink
      ? '#1a1a1a'
      : selectedTheme.textColor,
    filter: selectedDevice.eink ? 'grayscale(100%) contrast(1.05)' : 'none',
    border: selectedDevice.category === 'print' ? '1px solid #ccc' : '1px solid #e2e8f0',
    borderRadius: selectedDevice.category === 'print' ? '2px' : '4px',
    overflowY: 'auto' as const, // ALLOW SCROLLING within the device
    overflowX: 'hidden' as const,
    boxShadow: selectedDevice.category === 'print'
      ? '2px 2px 8px rgba(0,0,0,0.15)'
      : '0 1px 4px rgba(0,0,0,0.1)',
    position: 'relative' as const,
  };

  const contentHtml = previewContent || `
    <h1>Chapter One</h1>
    <p>The morning sun cast long shadows across the valley as she made her way down the winding path. Each step brought her closer to the village below, where the smell of fresh bread wafted through narrow cobblestone streets.</p>
    <p>She paused at the old stone bridge, watching the water rush beneath. It had been three years since she had last stood here, three years since everything changed.</p>
    <div style="text-align: center; margin: 1.5em 0; letter-spacing: 0.3em; color: #666;">* * *</div>
    <p>The inn was exactly as she remembered it. The same creaking door, the same worn wooden bar, the same faded paintings on the walls. Mrs. Hendricks stood behind the counter, her silver hair pulled into the same tight bun.</p>
  `;

  const filteredDevices = DEVICES.filter((d) => d.category === activeCategory);
  const categories = [...new Set(DEVICES.map((d) => d.category))];

  return (
    <div className="p-3 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Device Preview</h2>
          <p className="section-desc">See how your book looks on real devices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => callGas('openFullscreenPreview')}
            className="btn-secondary px-2"
            title="Open Fullscreen Preview"
          >
            ⛶
          </button>
          <button
            onClick={loadPreviewContent}
            disabled={loadingContent}
            className="btn-secondary"
          >
            {loadingContent ? 'Loading…' : '↻'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              const first = DEVICES.find((d) => d.category === cat);
              if (first) setSelectedDevice(first);
            }}
            className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors
              ${activeCategory === cat
                ? 'bg-white text-bookify-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Device Selector (within category) */}
      <div className="flex gap-1">
        {filteredDevices.map((device) => (
          <button
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className={`flex-1 py-1.5 rounded text-[10px] font-medium flex flex-col items-center gap-0.5
              ${selectedDevice.id === device.id
                ? 'bg-bookify-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <span>{device.icon}</span>
            <span>{device.name}</span>
          </button>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Font Size */}
        <div className="flex-1">
          <label className="text-[10px] text-gray-500">Font: {previewFontSize}px</label>
          <input
            type="range"
            min={8}
            max={24}
            value={previewFontSize}
            onChange={(e) => setPreviewFontSize(parseInt(e.target.value))}
            className="w-full h-1.5 accent-bookify-600"
          />
        </div>

        {/* Orientation Toggle */}
        {selectedDevice.category !== 'print' && (
          <button
            onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
            className="px-2 py-1 rounded text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200"
            title={orientation === 'portrait' ? 'Switch to landscape' : 'Switch to portrait'}
          >
            {orientation === 'portrait' ? '⬍' : '⬌'}
          </button>
        )}

        {/* Margins Toggle */}
        <button
          onClick={() => setShowMargins(!showMargins)}
          className={`px-2 py-1 rounded text-[10px] ${showMargins ? 'bg-bookify-50 text-bookify-600' : 'bg-gray-100 text-gray-500'}`}
          title="Toggle margins"
        >
          ☐
        </button>
      </div>

      {/* Theme Selector */}
      <div className="flex gap-1">
        {THEME_PRESETS.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme)}
            className={`flex-1 py-1 rounded text-[10px] font-medium
              ${selectedTheme.id === theme.id
                ? 'ring-2 ring-bookify-400 ring-offset-1'
                : ''}`}
            style={{
              background: theme.bodyBg,
              color: theme.textColor,
              border: `1px solid ${theme.id === 'dark' ? '#333' : '#e2e8f0'}`,
            }}
          >
            {theme.name}
          </button>
        ))}
      </div>

      {/* Device Dimensions Info */}
      <p className="text-[10px] text-gray-400">
        {selectedDevice.icon} {selectedDevice.name} — {selectedDevice.width}×{selectedDevice.height}mm
        {selectedDevice.eink ? ' · E-Ink' : ''}
        {selectedDevice.category === 'print' ? ' · Print trim' : ''}
        {' · '}{Math.round(scale * 100)}% zoom
      </p>

      {/* Preview Viewport */}
      <div
        className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-2 flex justify-center"
        style={{ minHeight: Math.min(deviceH * scale, maxHeight) + 16 }}
      >
        <div style={previewStyles} className="preview-container">
          <style>{`
            .preview-container h1 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.8}px; font-weight: bold; color: ${selectedDevice.eink ? '#1a1a1a' : selectedTheme.headingColor}; text-align: center; margin: 1.5em 0 0.8em; line-height: 1.2; }
            .preview-container h2 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.4}px; font-weight: bold; color: ${selectedDevice.eink ? '#1a1a1a' : selectedTheme.headingColor}; margin: 1.2em 0 0.6em; }
            .preview-container h3 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.2}px; font-weight: bold; margin: 1em 0 0.5em; }
            .preview-container p { text-indent: 1.5em; margin: 0 0 0.5em; text-align: ${selectedDevice.css.textAlign || 'left'}; }
            .preview-container h1 + p, .preview-container h2 + p { text-indent: 0; }
            .preview-container img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
            .preview-container .callout-box { border: 2px solid ${selectedTheme.headingColor}; border-radius: 8px; padding: 1em; margin: 1em 0; background-color: rgba(0,0,0,0.03); }
            .preview-container .text-msg-container { margin: 1em 0; display: flow-root; }
            .preview-container .text-msg { padding: 0.6em 1em; border-radius: 1em; max-width: 80%; }
            .preview-container .text-msg-sent { background: #007AFF; color: white; float: right; border-bottom-right-radius: 0.3em; margin-left: auto; }
            .preview-container .text-msg-received { background: #E9E9EB; color: #1a1a1a; float: left; border-bottom-left-radius: 0.3em; }
            /* Custom scrollbar for simulator */
            .preview-container::-webkit-scrollbar { width: 4px; }
            .preview-container::-webkit-scrollbar-track { background: transparent; }
            .preview-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
            .preview-container::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
          `}</style>

          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />

          {/* Print-specific: page number */}
          {selectedDevice.category === 'print' && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: `${Math.max(previewFontSize - 3, 8)}px`,
                color: '#999',
                pointerEvents: 'none',
              }}
            >
              — 1 —
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center italic">
        Preview approximation. Final export uses full device CSS profiles.
      </p>
    </div>
  );
}
