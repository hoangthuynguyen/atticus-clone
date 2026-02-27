import { useAppStore } from './store/appStore';
import { ExportPanel } from './components/ExportPanel';
import { FormattingPanel } from './components/FormattingPanel';
import { ThemePanel } from './components/ThemePanel';
import { WritingToolsPanel } from './components/WritingToolsPanel';
import { StructurePanel } from './components/StructurePanel';
import { PreviewerPanel } from './components/PreviewerPanel';
import { VersionManagerPanel } from './components/VersionManagerPanel';

const TABS = [
  { id: 'export' as const, label: 'Export', icon: '>' },
  { id: 'formatting' as const, label: 'Format', icon: 'A' },
  { id: 'themes' as const, label: 'Themes', icon: '#' },
  { id: 'tools' as const, label: 'Tools', icon: '+' },
  { id: 'structure' as const, label: 'Structure', icon: '=' },
  { id: 'previewer' as const, label: 'Preview', icon: 'D' },
  { id: 'versions' as const, label: 'Versions', icon: 'V' },
];

export default function App() {
  const { activeTab, setActiveTab, error, setError } = useAppStore();

  return (
    <div className="flex flex-col h-screen max-w-sidebar">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white">
        <div className="w-6 h-6 bg-atticus-600 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <span className="text-sm font-semibold text-gray-800">Atticus</span>
      </header>

      {/* Tab Navigation */}
      <nav className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-1 py-2 text-[11px] font-medium text-center transition-colors
              ${activeTab === tab.id
                ? 'text-atticus-600 border-b-2 border-atticus-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">
            x
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
        {activeTab === 'versions' && <VersionManagerPanel />}
      </main>

      {/* Footer */}
      <footer className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] text-gray-400 text-center">Atticus Book Formatter v1.0</p>
      </footer>
    </div>
  );
}
