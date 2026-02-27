import { useState } from 'react';

const DEVICES = [
  { id: 'kindle', name: 'Kindle PW', width: 125, fontSize: 16, eink: true },
  { id: 'kobo', name: 'Kobo Libra', width: 136, fontSize: 15, eink: true },
  { id: 'ipad', name: 'iPad Mini', width: 195, fontSize: 14, eink: false },
  { id: 'iphone', name: 'iPhone', width: 95, fontSize: 13, eink: false },
  { id: 'galaxy', name: 'Galaxy', width: 92, fontSize: 13, eink: false },
];

export function PreviewerPanel() {
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [previewFontSize, setPreviewFontSize] = useState(14);
  const [darkMode, setDarkMode] = useState(false);

  // Scale factor to fit device width into 320px sidebar
  const scale = Math.min(1, 310 / selectedDevice.width);

  const previewStyles: React.CSSProperties = {
    width: `${selectedDevice.width}mm`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    fontSize: `${previewFontSize}px`,
    fontFamily: selectedDevice.eink ? 'Georgia, serif' : 'system-ui, sans-serif',
    lineHeight: 1.6,
    padding: '8mm',
    background: darkMode ? '#1a1a1a' : selectedDevice.eink ? '#f5f0e8' : '#ffffff',
    color: darkMode ? '#e0e0e0' : '#1a1a1a',
    filter: selectedDevice.eink ? 'grayscale(100%) contrast(1.1)' : 'none',
    minHeight: '400px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  return (
    <div className="p-3 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800">Device Preview</h2>

      {/* Device Selector */}
      <div className="flex gap-1">
        {DEVICES.map((device) => (
          <button
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className={`flex-1 py-1.5 rounded text-[10px] font-medium
              ${selectedDevice.id === device.id
                ? 'bg-atticus-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {device.name}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500">Font Size: {previewFontSize}px</label>
          <input
            type="range"
            min={10}
            max={22}
            value={previewFontSize}
            onChange={(e) => setPreviewFontSize(parseInt(e.target.value))}
            className="w-full h-1.5 accent-atticus-600"
          />
        </div>
        {!selectedDevice.eink && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-2 py-1 rounded text-[10px] ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {darkMode ? 'Dark' : 'Light'}
          </button>
        )}
      </div>

      {/* Device info */}
      <p className="text-[10px] text-gray-400">
        {selectedDevice.name} - {selectedDevice.width}mm wide
        {selectedDevice.eink ? ' (E-Ink)' : ' (Color)'}
      </p>

      {/* Preview */}
      <div className="overflow-hidden rounded border border-gray-200 bg-gray-100 p-2">
        <div style={previewStyles}>
          <h1 style={{
            fontSize: `${previewFontSize * 2}px`,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '2em 0 1em',
          }}>
            Chapter One
          </h1>
          <p style={{ textIndent: 0, marginBottom: '0.5em' }}>
            The morning sun cast long shadows across the valley as she made her way down the winding path. Each step brought her closer to the village below, where the smell of fresh bread wafted through narrow cobblestone streets.
          </p>
          <p style={{ textIndent: '1.5em', marginBottom: '0.5em' }}>
            She paused at the old stone bridge, watching the water rush beneath. It had been three years since she had last stood here, three years since everything changed.
          </p>
          <p style={{ textAlign: 'center', margin: '1.5em 0', letterSpacing: '0.3em' }}>
            * * *
          </p>
          <p style={{ textIndent: 0, marginBottom: '0.5em' }}>
            The inn was exactly as she remembered it. The same creaking door, the same worn wooden bar, the same faded paintings on the walls.
          </p>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center">
        Preview is an approximation. Final export may differ slightly.
      </p>
    </div>
  );
}
