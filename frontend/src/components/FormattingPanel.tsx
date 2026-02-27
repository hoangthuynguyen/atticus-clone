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
];

const FRONT_MATTER_TYPES = [
  { id: 'title-page',     label: 'Title Page',      emoji: '📰', type: 'front' },
  { id: 'copyright',      label: 'Copyright Page',  emoji: '©',  type: 'front' },
  { id: 'dedication',     label: 'Dedication',      emoji: '♡',  type: 'front' },
  { id: 'about-author',   label: 'About the Author',emoji: '👤', type: 'back' },
  { id: 'also-by',        label: 'Also By',         emoji: '📚', type: 'back' },
  { id: 'acknowledgments',label: 'Acknowledgments', emoji: '🙏', type: 'back' },
];

const CALLOUT_STYLES = [
  { label: 'Info',    bg: '#EFF6FF', border: '#1E40AF', text: '#1E3A8A', icon: 'ℹ' },
  { label: 'Warning', bg: '#FFFBEB', border: '#D97706', text: '#92400E', icon: '⚠' },
  { label: 'Success', bg: '#F0FDF4', border: '#16A34A', text: '#14532D', icon: '✓' },
  { label: 'Quote',   bg: '#F8FAFC', border: '#64748B', text: '#334155', icon: '"' },
];

type Section = 'scene-breaks' | 'callout' | 'text-message' | 'front-matter' | 'drop-caps';

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'scene-breaks',  label: 'Scene Breaks',    emoji: '✦' },
  { id: 'callout',       label: 'Call-Out',         emoji: '▣' },
  { id: 'text-message',  label: 'Text Msgs',        emoji: '💬' },
  { id: 'front-matter',  label: 'Front Matter',     emoji: '📄' },
  { id: 'drop-caps',     label: 'Drop Caps',        emoji: 'D' },
];

export function FormattingPanel() {
  const [activeSection, setActiveSection] = useState<Section>('scene-breaks');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  async function withStatus<T>(fn: () => Promise<T>, successMsg: string) {
    setLoading(true);
    setStatus(null);
    try {
      await fn();
      setStatus({ text: successMsg, ok: true });
    } catch (err) {
      setStatus({ text: `Error: ${err instanceof Error ? err.message : String(err)}`, ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Section tabs */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Formatting</h2>
        <div className="flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors
                ${activeSection === s.id
                  ? 'bg-atticus-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mx-3 mt-2 px-2 py-1.5 rounded-md text-[11px] flex items-center gap-1.5
          ${status.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span>{status.ok ? '✓' : '✕'}</span>
          <span>{status.text}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 pb-20">

        {/* Scene Breaks */}
        {activeSection === 'scene-breaks' && (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-500">Click a symbol to insert at cursor position in your document:</p>
            <div className="grid grid-cols-6 gap-1">
              {SCENE_BREAK_SYMBOLS.map((symbol, i) => (
                <button
                  key={i}
                  onClick={() => withStatus(() => callGas('insertSceneBreak', symbol), `Scene break inserted`)}
                  disabled={loading}
                  className="aspect-square flex items-center justify-center text-lg bg-white border border-gray-200
                    rounded-md hover:bg-atticus-50 hover:border-atticus-300 hover:text-atticus-700
                    active:scale-95 transition-all disabled:opacity-40 shadow-sm"
                  title={`Insert: ${symbol}`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Call-Out Box */}
        {activeSection === 'callout' && (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-500">Insert a styled callout box at cursor position:</p>
            <div className="grid grid-cols-2 gap-2">
              {CALLOUT_STYLES.map((style) => (
                <button
                  key={style.label}
                  onClick={() => withStatus(
                    () => callGas('insertCalloutBox', {
                      title: style.label,
                      text: 'Type your content here...',
                      bgColor: style.bg,
                      borderColor: style.border,
                      icon: style.icon,
                    }),
                    `${style.label} callout inserted`
                  )}
                  disabled={loading}
                  className="p-3 rounded-lg border-2 text-left hover:shadow-sm disabled:opacity-50 transition-all active:scale-95"
                  style={{ borderColor: style.border, backgroundColor: style.bg }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm" style={{ color: style.text }}>{style.icon}</span>
                    <span className="text-xs font-semibold" style={{ color: style.text }}>{style.label}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: style.border }}>
                    {style.label === 'Info'    ? 'For informational notes' :
                     style.label === 'Warning' ? 'For cautions & alerts' :
                     style.label === 'Success' ? 'For positive highlights' :
                     'For block quotations'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Messages */}
        {activeSection === 'text-message' && (
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500">
              Insert an SMS/chat bubble layout at cursor. Styled as iOS-like bubbles when exported to EPUB/PDF.
            </p>
            {/* Preview */}
            <div className="bg-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex">
                <div className="bg-gray-300 text-gray-800 text-xs px-3 py-1.5 rounded-2xl rounded-bl-sm max-w-[70%]">
                  Hey, are you coming?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-2xl rounded-br-sm max-w-[70%]">
                  On my way!
                </div>
              </div>
            </div>
            <button
              onClick={() => withStatus(
                () => callGas('insertTextMessages', [
                  { sender: 'Alice', text: 'Hey, are you coming?', isSent: false },
                  { sender: 'Me',    text: 'On my way!',           isSent: true },
                ]),
                'Text messages inserted'
              )}
              disabled={loading}
              className="w-full py-2.5 bg-atticus-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-atticus-700 transition-colors"
            >
              {loading ? 'Inserting…' : 'Insert Example Conversation'}
            </button>
          </div>
        )}

        {/* Front/Back Matter */}
        {activeSection === 'front-matter' && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-600 mb-1.5">Front Matter</p>
              <div className="space-y-1">
                {FRONT_MATTER_TYPES.filter(m => m.type === 'front').map((fm) => (
                  <button
                    key={fm.id}
                    onClick={() => withStatus(
                      () => callGas('insertFrontMatter', fm.id, {
                        title: 'Book Title',
                        author: 'Author Name',
                        subtitle: '',
                      }),
                      `${fm.label} inserted`
                    )}
                    disabled={loading}
                    className="w-full p-2 text-left bg-white border border-gray-200 rounded-md text-xs
                      hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors
                      flex items-center gap-2"
                  >
                    <span>{fm.emoji}</span>
                    <span className="text-gray-700">{fm.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-600 mb-1.5">Back Matter</p>
              <div className="space-y-1">
                {FRONT_MATTER_TYPES.filter(m => m.type === 'back').map((fm) => (
                  <button
                    key={fm.id}
                    onClick={() => withStatus(
                      () => callGas('insertFrontMatter', fm.id, {
                        title: 'Book Title',
                        author: 'Author Name',
                        subtitle: '',
                      }),
                      `${fm.label} inserted`
                    )}
                    disabled={loading}
                    className="w-full p-2 text-left bg-white border border-gray-200 rounded-md text-xs
                      hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors
                      flex items-center gap-2"
                  >
                    <span>{fm.emoji}</span>
                    <span className="text-gray-700">{fm.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Drop Caps */}
        {activeSection === 'drop-caps' && (
          <div className="space-y-3">
            {/* Visual demo */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="float-left text-5xl font-bold text-atticus-600 mr-1 leading-[0.8] mt-1">T</span>
              <p className="text-xs text-gray-600 leading-relaxed">
                he morning sun cast long shadows across the valley as she made her way down the winding path to the village below.
              </p>
              <div className="clear-both" />
            </div>
            <p className="text-[11px] text-gray-500">
              Apply a drop cap to the first paragraph at the cursor position. Fully rendered in EPUB/PDF exports.
            </p>
            <button
              onClick={() => withStatus(
                () => callGas('applyDropCapStyle', { fontSize: 36, color: '#333333' }),
                'Drop cap applied'
              )}
              disabled={loading}
              className="w-full py-2.5 bg-atticus-600 text-white rounded-lg text-xs font-semibold
                disabled:opacity-50 hover:bg-atticus-700 transition-colors"
            >
              {loading ? 'Applying…' : 'Apply Drop Cap'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
