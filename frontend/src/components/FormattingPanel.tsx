import { useState } from 'react';
import { callGas } from '../hooks/useGasBridge';

const SCENE_BREAK_SYMBOLS = [
  '* * *', '~ ~ ~', '- - -',
  '\u2022 \u2022 \u2022', '\u2014', '\u2766',
  '\u2726', '\u2605', '\u2042',
  '\u273B', '\u25C6', '\u2620',
  '\u2756', '\u2767', '\u2619',
  '\u2740', '\u2741', '\u2743',
  '\u2744', '\u2745', '\u2746',
  '\u274B', '\u2736', '\u2737',
  '\u2738', '\u2739', '\u273A',
  '\u273C', '\u273D', '\u2747',
  '\u2748', '\u274A', '\u2749',
  '\u25CA', '\u25CB', '\u25CF',
  '\u25AA', '\u25AB', '\u25B2',
];

const FRONT_MATTER_TYPES = [
  { id: 'title-page', label: 'Title Page', type: 'front' },
  { id: 'copyright', label: 'Copyright Page', type: 'front' },
  { id: 'dedication', label: 'Dedication', type: 'front' },
  { id: 'about-author', label: 'About the Author', type: 'back' },
  { id: 'also-by', label: 'Also By', type: 'back' },
  { id: 'acknowledgments', label: 'Acknowledgments', type: 'back' },
];

export function FormattingPanel() {
  const [activeSection, setActiveSection] = useState<string>('scene-breaks');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleInsertSceneBreak(symbol: string) {
    setLoading(true);
    setStatus(null);
    try {
      await callGas('insertSceneBreak', symbol);
      setStatus('Scene break inserted');
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }


  async function handleInsertFrontMatter(type: string) {
    setLoading(true);
    try {
      await callGas('insertFrontMatter', type, {
        title: 'Book Title',
        author: 'Author Name',
        subtitle: '',
      });
      setStatus(`${type} inserted`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleInsertTextMessage() {
    setLoading(true);
    setStatus(null);
    try {
      await callGas('insertTextMessages', [
        { sender: 'Alice', text: 'Hey, are you coming?', isSent: false },
        { sender: 'Me', text: 'On my way!', isSent: true }
      ]);
      setStatus('Text messages inserted');
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  const sections = [
    { id: 'scene-breaks', label: 'Scene Breaks' },
    { id: 'callout', label: 'Call-Out Box' },
    { id: 'text-message', label: 'Text Messages' },
    { id: 'front-matter', label: 'Front/Back Matter' },
    { id: 'drop-caps', label: 'Drop Caps' },
  ];

  return (
    <div className="p-3 space-y-3 pb-20">
      <h2 className="text-sm font-semibold text-gray-800">Formatting</h2>

      {/* Section selector */}
      <div className="flex flex-wrap gap-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-2 py-1 rounded text-[11px] font-medium
              ${activeSection === s.id ? 'bg-atticus-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Status message */}
      {status && (
        <p className={`text-[11px] p-2 rounded ${status.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {status}
        </p>
      )}

      {/* Scene Breaks */}
      {activeSection === 'scene-breaks' && (
        <div>
          <p className="text-[11px] text-gray-500 mb-2">Click a symbol to insert at cursor position:</p>
          <div className="grid grid-cols-6 gap-1">
            {SCENE_BREAK_SYMBOLS.map((symbol, i) => (
              <button
                key={i}
                onClick={() => handleInsertSceneBreak(symbol)}
                disabled={loading}
                className="p-2 text-center text-lg bg-gray-50 rounded hover:bg-atticus-50 hover:ring-1 hover:ring-atticus-300 transition-all disabled:opacity-50"
                title={symbol}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Call-Out Box */}
      {activeSection === 'callout' && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Insert a styled callout box at cursor:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Info', bg: '#EFF6FF', border: '#1E40AF', icon: 'i' },
              { label: 'Warning', bg: '#FFFBEB', border: '#D97706', icon: '!' },
              { label: 'Success', bg: '#F0FDF4', border: '#16A34A', icon: 'v' },
              { label: 'Quote', bg: '#F8FAFC', border: '#64748B', icon: '"' },
            ].map((style) => (
              <button
                key={style.label}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await callGas('insertCalloutBox', {
                      title: style.label,
                      text: 'Type here...',
                      bgColor: style.bg,
                      borderColor: style.border,
                      icon: style.icon,
                    });
                    setStatus(`${style.label} callout inserted`);
                  } catch (err) {
                    setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="p-2 rounded border-2 text-xs font-medium hover:shadow-sm disabled:opacity-50"
                style={{ borderColor: style.border, backgroundColor: style.bg }}
              >
                {style.icon} {style.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Front/Back Matter */}
      {activeSection === 'front-matter' && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-700 mb-1">Front Matter</p>
            <div className="space-y-1">
              {FRONT_MATTER_TYPES.filter(m => m.type === 'front').map((fm) => (
                <button
                  key={fm.id}
                  onClick={() => handleInsertFrontMatter(fm.id)}
                  disabled={loading}
                  className="w-full p-2 text-left bg-gray-50 rounded text-xs hover:bg-gray-100 disabled:opacity-50"
                >
                  {fm.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-700 mb-1">Back Matter</p>
            <div className="space-y-1">
              {FRONT_MATTER_TYPES.filter(m => m.type === 'back').map((fm) => (
                <button
                  key={fm.id}
                  onClick={() => handleInsertFrontMatter(fm.id)}
                  disabled={loading}
                  className="w-full p-2 text-left bg-gray-50 rounded text-xs hover:bg-gray-100 disabled:opacity-50"
                >
                  {fm.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Text Message Formatter */}
      {activeSection === 'text-message' && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Insert an SMS/chat bubble layout at cursor:</p>
          <button
            onClick={handleInsertTextMessage}
            disabled={loading}
            className="w-full py-2 bg-atticus-600 text-white rounded text-xs font-medium disabled:opacity-50"
          >
            Insert Example Conversation
          </button>
          <p className="text-[10px] text-gray-400">
            Note: The conversation structure is laid out as a table in Docs and will be styled like iOS/Android bubbles when exported to EPUB/PDF.
          </p>
        </div>
      )}

      {/* Drop Caps */}
      {activeSection === 'drop-caps' && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Apply drop cap to paragraph at cursor:</p>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await callGas('applyDropCapStyle', { fontSize: 36, color: '#333333' });
                setStatus('Drop cap applied');
              } catch (err) {
                setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-2 bg-atticus-600 text-white rounded text-xs font-medium disabled:opacity-50"
          >
            Apply Drop Cap
          </button>
          <p className="text-[10px] text-gray-400">
            Note: Drop caps are fully rendered in EPUB/PDF exports. In Google Docs, the first letter will be enlarged as a preview.
          </p>
        </div>
      )}
    </div>
  );
}
