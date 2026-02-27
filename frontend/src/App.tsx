import { useAppStore } from './store/appStore';
import { ExportPanel } from './components/ExportPanel';
import { FormattingPanel } from './components/FormattingPanel';
import { ThemePanel } from './components/ThemePanel';
import { WritingToolsPanel } from './components/WritingToolsPanel';
import { StructurePanel } from './components/StructurePanel';
import { PreviewerPanel } from './components/PreviewerPanel';
import { VersionManagerPanel } from './components/VersionManagerPanel';
import { BoxSetPanel } from './components/BoxSetPanel';

const TABS = [
  { id: 'export' as const, label: 'Export', icon: '↓' },
  { id: 'formatting' as const, label: 'Format', icon: '¶' },
  { id: 'themes' as const, label: 'Themes', icon: '◐' },
  { id: 'tools' as const, label: 'Tools', icon: '✎' },
  { id: 'structure' as const, label: 'Structure', icon: '☰' },
  { id: 'previewer' as const, label: 'Preview', icon: '⊡' },
  { id: 'boxset' as const, label: 'Box Sets', icon: '📦' },
  { id: 'versions' as const, label: 'Versions', icon: '⌛' },
];



export default function App() {
  const { activeTab, setActiveTab, error, setError } = useAppStore();

  return (
    <div className="flex flex-col h-screen max-w-sidebar bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-bookify-600 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white text-[13px] font-bold">A</span>
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900">Bookify</span>
          <span className="ml-1.5 text-[10px] text-gray-400">Book Formatter</span>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex overflow-x-auto border-b border-gray-100 bg-gray-50" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={`flex-1 min-w-[70px] flex-shrink-0 py-2.5 flex flex-col items-center gap-1 transition-colors border-b-2
              ${activeTab === tab.id
                ? 'border-bookify-600 text-bookify-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
              }`}
          >
            <span className="text-[14px] leading-none block">{tab.icon}</span>
            <span className="text-[10px] font-medium whitespace-nowrap block">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-start gap-2">
          <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">!</span>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-500 text-sm font-bold leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'export' && <ExportPanel />}
        {activeTab === 'formatting' && <FormattingPanel />}
        {activeTab === 'themes' && <ThemePanel />}
        {activeTab === 'tools' && <WritingToolsPanel />}
        {activeTab === 'structure' && <StructurePanel />}
        {activeTab === 'previewer' && <PreviewerPanel />}
        {activeTab === 'boxset' && <BoxSetPanel />}
        {activeTab === 'versions' && <VersionManagerPanel />}
      </main>

      {/* Footer */}
      <footer className="px-3 py-1 border-t border-gray-100 bg-gray-50">
        <p className="text-[9px] text-gray-300 text-center font-medium tracking-wider uppercase">Bookify v1.0</p>
      </footer>
    </div>
  );
}
