import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface Heading {
  text: string;
  level: number;
  index: number;
}

interface Version {
  revisionId: string;
  name: string | null;
  date: string;
  fileSize: string;
  lastModifyingUser: string;
}

export function StructurePanel() {
  const [activeSection, setActiveSection] = useState<'chapters' | 'versions' | 'matter'>('chapters');

  return (
    <div className="p-3 space-y-3 pb-20 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-gray-800">Structure & Pages</h2>

      <div className="flex gap-1">
        <button
          onClick={() => setActiveSection('chapters')}
          className={`flex-1 px-2 py-1.5 rounded text-[11px] font-bold transition-colors
            ${activeSection === 'chapters' ? 'bg-bookify-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Chapters
        </button>
        <button
          onClick={() => setActiveSection('matter')}
          className={`flex-1 px-2 py-1.5 rounded text-[11px] font-bold transition-colors
            ${activeSection === 'matter' ? 'bg-bookify-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Pages
        </button>
        <button
          onClick={() => setActiveSection('versions')}
          className={`flex-1 px-2 py-1.5 rounded text-[11px] font-bold transition-colors
            ${activeSection === 'versions' ? 'bg-bookify-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Versions
        </button>
      </div>

      <div className="pt-2">
        {activeSection === 'chapters' && <ChapterList />}
        {activeSection === 'matter' && <MatterGenerator />}
        {activeSection === 'versions' && <VersionManager />}
      </div>
    </div>
  );
}

function ChapterList() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHeadings(); }, []);

  async function loadHeadings() {
    try {
      const content = await callGas<{ headings: Heading[] }>('getDocumentContent');
      setHeadings(content.headings || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (headings.length === 0) {
    return (
      <p className="text-[11px] text-gray-500 p-3 bg-gray-50 rounded">
        No headings found. Use Heading 1 for chapters, Heading 2 for scenes.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-gray-500 mb-2">{headings.length} headings found</p>
      {headings.map((h, i) => (
        <div
          key={i}
          className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-50 cursor-pointer"
          style={{ paddingLeft: `${(h.level - 1) * 12 + 6}px` }}
        >
          <span className="text-[9px] text-gray-400 w-5 flex-shrink-0">H{h.level}</span>
          <span className="text-xs text-gray-700 truncate">{h.text || '(empty)'}</span>
        </div>
      ))}
    </div>
  );
}

function VersionManager() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVersionName, setNewVersionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { loadVersions(); }, []);

  async function loadVersions() {
    try {
      const result = await callGas<Version[]>('listVersions');
      setVersions(result || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVersion() {
    if (!newVersionName.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await callGas('createNamedVersion', newVersionName);
      setStatus(`Version "${newVersionName}" created`);
      setNewVersionName('');
      loadVersions();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Create new version */}
      <div className="flex gap-1">
        <input
          type="text"
          value={newVersionName}
          onChange={(e) => setNewVersionName(e.target.value)}
          placeholder="Version name (e.g., v2.3 - Post-editor)"
          className="flex-1 p-1.5 border rounded text-xs focus:ring-1 focus:ring-bookify-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleCreateVersion()}
        />
        <button
          onClick={handleCreateVersion}
          disabled={saving || !newVersionName.trim()}
          className="px-3 py-1.5 bg-bookify-600 text-white rounded text-xs font-medium disabled:opacity-50"
        >
          Save
        </button>
      </div>

      {status && (
        <p className={`text-[11px] p-2 rounded ${status.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {status}
        </p>
      )}

      {/* Version list */}
      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : versions.length === 0 ? (
        <p className="text-[11px] text-gray-500">No saved versions yet.</p>
      ) : (
        <div className="space-y-1">
          {versions.slice(0, 20).map((v) => (
            <div key={v.revisionId} className="p-2 bg-gray-50 rounded">
              <div className="flex justify-between items-start">
                <div>
                  {v.name && <p className="text-xs font-medium text-gray-800">{v.name}</p>}
                  <p className="text-[10px] text-gray-500">
                    {new Date(v.date).toLocaleDateString()} by {v.lastModifyingUser}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400">{v.fileSize}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatterGenerator() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const MATTERS = [
    { id: 'title-page', label: 'Title Page', position: 'front' },
    { id: 'copyright', label: 'Copyright Page', position: 'front' },
    { id: 'dedication', label: 'Dedication', position: 'front' },
    { id: 'about-author', label: 'About the Author', position: 'back' },
    { id: 'also-by', label: 'Also By', position: 'back' },
    { id: 'acknowledgments', label: 'Acknowledgments', position: 'back' },
  ];

  async function handleInsert(type: string, position: string) {
    setLoading(true);
    setStatus(null);
    try {
      // Prompt user for some basic data based on type
      let data: any = {};
      if (type === 'copyright') {
        data.author = prompt('Author Name:', 'Author Name') || 'Author Name';
        data.year = new Date().getFullYear();
      } else if (type === 'title-page') {
        data.title = prompt('Book Title:', 'Book Title') || 'Book Title';
        data.author = prompt('Author Name:', 'Author Name') || 'Author Name';
      } else if (type === 'dedication') {
        data.text = prompt('Dedication text:', 'For...') || 'For...';
      } else if (type === 'also-by') {
        data.author = prompt('Author Name:', 'Author Name') || 'Author Name';
      }

      const res = await callGas<{ success: boolean, type: string }>('insertFrontMatter', type, data, position);
      if (res && res.success) {
        setStatus(`Successfully inserted ${type.replace('-', ' ')}!`);
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      alert(`Error inserting matter: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5">
        <p className="text-[11px] text-gray-600 leading-relaxed mb-2">
          Automatically generate standard publishing pages. They will be inserted at the beginning (Front) or end (Back) of your document.
        </p>

        {status && (
          <div className="mb-3 px-2 py-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] rounded flex items-center gap-1.5">
            <span className="font-bold">✓</span> {status}
          </div>
        )}

        <div className="space-y-3 mt-3">
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Front Matter</h3>
            <div className="grid gap-1.5">
              {MATTERS.filter(m => m.position === 'front').map(m => (
                <button
                  key={m.id}
                  onClick={() => handleInsert(m.id, m.position)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-700 hover:border-bookify-400 hover:text-bookify-700 transition-colors disabled:opacity-50 flex justify-between items-center"
                >
                  <span>{m.label}</span>
                  <span className="text-gray-300 text-[10px]">+ Insert</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">Back Matter</h3>
            <div className="grid gap-1.5">
              {MATTERS.filter(m => m.position === 'back').map(m => (
                <button
                  key={m.id}
                  onClick={() => handleInsert(m.id, m.position)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-700 hover:border-bookify-400 hover:text-bookify-700 transition-colors disabled:opacity-50 flex justify-between items-center"
                >
                  <span>{m.label}</span>
                  <span className="text-gray-300 text-[10px]">+ Insert</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
