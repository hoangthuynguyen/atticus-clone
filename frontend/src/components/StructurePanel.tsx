import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface Heading {
  text: string;
  level: number;
  index: number;
}

export function StructurePanel() {
  const [activeSection, setActiveSection] = useState<'chapters' | 'matter' | 'versions'>('chapters');

  return (
    <div className="p-3 space-y-3 pb-20 animate-fade-in">
      <div>
        <h2 className="section-heading">Structure & Pages</h2>
        <p className="section-desc">Manage chapters, front/back matter, and versions</p>
      </div>

      {/* Segmented control */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {(['chapters', 'matter', 'versions'] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
              ${activeSection === s ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {s === 'chapters' ? '📑 Chapters' : s === 'matter' ? '📄 Pages' : '⏳ Versions'}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {activeSection === 'chapters' && <ChapterList />}
        {activeSection === 'matter' && <MatterGenerator />}
        {activeSection === 'versions' && <VersionManager />}
      </div>
    </div>
  );
}

/* ─── Chapter List with TOC Generator ─── */
function ChapterList() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [loading, setLoading] = useState(true);
  const [tocStatus, setTocStatus] = useState<string | null>(null);
  const [generatingToc, setGeneratingToc] = useState(false);

  useEffect(() => { loadHeadings(); }, []);

  async function loadHeadings() {
    try {
      const content = await callGas<{ headings: Heading[] }>('getDocumentContent');
      setHeadings(content.headings || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleGenerateToc() {
    setGeneratingToc(true);
    setTocStatus(null);
    try {
      const result = await callGas<{ success: boolean; count: number }>('generateTableOfContents');
      setTocStatus(`✅ Table of Contents created with ${result.count} entries!`);
      loadHeadings();
    } catch (e) {
      setTocStatus(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGeneratingToc(false);
    }
  }

  if (loading) {
    return <div className="space-y-1.5">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}</div>;
  }

  const chapterCount = headings.filter(h => h.level === 1).length;

  return (
    <div className="space-y-3">
      {/* TOC Generator */}
      <div className="card-section border-l-[3px] border-l-bookify-400 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-700">Table of Contents</p>
          <p className="text-[10px] text-gray-400">Auto-generate from headings</p>
        </div>
        <button onClick={handleGenerateToc} disabled={generatingToc || headings.length === 0} className="btn-secondary">
          {generatingToc ? 'Generating…' : '+ Generate TOC'}
        </button>
      </div>

      {tocStatus && (
        <p className={`text-[11px] p-2 rounded-lg ${tocStatus.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {tocStatus}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center py-2 bg-bookify-50 rounded-lg">
          <p className="text-lg font-bold text-bookify-600">{chapterCount}</p>
          <p className="text-[9px] text-gray-400 font-medium">Chapters</p>
        </div>
        <div className="text-center py-2 bg-violet-50 rounded-lg">
          <p className="text-lg font-bold text-violet-600">{headings.filter(h => h.level === 2).length}</p>
          <p className="text-[9px] text-gray-400 font-medium">Scenes</p>
        </div>
        <div className="text-center py-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-600">{headings.length}</p>
          <p className="text-[9px] text-gray-400 font-medium">Total</p>
        </div>
      </div>

      {/* Heading list */}
      {headings.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-2xl mb-2">📑</p>
          <p className="text-xs">No headings found</p>
          <p className="text-[10px] mt-1">Use Heading 1 for chapters, Heading 2 for scenes</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {headings.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              style={{ paddingLeft: `${(h.level - 1) * 14 + 8}px` }}>
              <span className={`text-[9px] font-bold w-5 flex-shrink-0 ${h.level === 1 ? 'text-bookify-500' : 'text-gray-300'}`}>H{h.level}</span>
              <span className={`truncate ${h.level === 1 ? 'text-xs font-semibold text-gray-800' : 'text-[11px] text-gray-500'}`}>
                {h.text || '(empty)'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Version Manager ─── */
function VersionManager() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVersionName, setNewVersionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { loadVersions(); }, []);

  async function loadVersions() {
    try {
      const result = await callGas<any[]>('listVersions');
      setVersions(result || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleCreateVersion() {
    if (!newVersionName.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await callGas('createNamedVersion', newVersionName);
      setStatus(`Version "${newVersionName}" saved`);
      setNewVersionName('');
      loadVersions();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      {/* Create version */}
      <div className="flex gap-1.5">
        <input
          type="text" value={newVersionName}
          onChange={e => setNewVersionName(e.target.value)}
          placeholder="Version name (e.g., v2.3 - Post-editor)"
          className="input-field flex-1"
          onKeyDown={e => e.key === 'Enter' && handleCreateVersion()}
        />
        <button onClick={handleCreateVersion} disabled={saving || !newVersionName.trim()} className="btn-primary !w-auto !px-4">
          Save
        </button>
      </div>

      {status && (
        <p className={`text-[11px] p-2 rounded-lg animate-slide-up ${status.startsWith('Error') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {status}
        </p>
      )}

      {/* Version list */}
      {loading ? (
        <div className="space-y-1.5">{[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-2xl mb-2">⏳</p>
          <p className="text-xs">No saved versions</p>
          <p className="text-[10px] mt-1">Save versions to track your progress</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {versions.slice(0, 20).map((v, i) => (
            <div key={v.revisionId} className={`card-section ${i === 0 ? 'border-l-[3px] border-l-bookify-400' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  {v.name && <p className="text-xs font-semibold text-gray-800">{v.name}</p>}
                  <p className="text-[10px] text-gray-400">
                    {new Date(v.date).toLocaleDateString()} · {v.lastModifyingUser}
                  </p>
                </div>
                <span className="badge bg-gray-100 text-gray-500">{v.fileSize}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Matter Generator ─── */
function MatterGenerator() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const MATTERS = [
    { id: 'title-page', label: 'Title Page', icon: '📕', position: 'front' },
    { id: 'copyright', label: 'Copyright Page', icon: '©', position: 'front' },
    { id: 'dedication', label: 'Dedication', icon: '❤️', position: 'front' },
    { id: 'about-author', label: 'About the Author', icon: '✍️', position: 'back' },
    { id: 'also-by', label: 'Also By', icon: '📚', position: 'back' },
    { id: 'acknowledgments', label: 'Acknowledgments', icon: '🙏', position: 'back' },
  ];

  async function handleInsert(type: string, position: string) {
    setLoading(true);
    setStatus(null);
    try {
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

      const res = await callGas<{ success: boolean }>('insertFrontMatter', type, data, position);
      if (res?.success) {
        setStatus(`✅ ${type.replace(/-/g, ' ')} inserted!`);
        setTimeout(() => setStatus(null), 4000);
      }
    } catch (err) {
      setStatus(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card-section">
        <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
          Generate standard publishing pages. Front matter is inserted at the beginning, back matter at the end.
        </p>

        {status && (
          <div className={`mb-3 px-2.5 py-2 rounded-lg text-[11px] font-medium animate-slide-down ${status.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
            {status}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="section-title mb-2">Front Matter</p>
            <div className="space-y-1.5">
              {MATTERS.filter(m => m.position === 'front').map(m => (
                <button key={m.id} onClick={() => handleInsert(m.id, m.position)} disabled={loading}
                  className="w-full text-left px-3 py-2.5 card hover:shadow-card-hover rounded-lg text-xs text-gray-700 transition-all disabled:opacity-50 flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <span>{m.icon}</span>
                    <span className="font-medium">{m.label}</span>
                  </span>
                  <span className="text-[10px] text-gray-300 group-hover:text-bookify-500 transition-colors">+ Insert</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="section-title mb-2">Back Matter</p>
            <div className="space-y-1.5">
              {MATTERS.filter(m => m.position === 'back').map(m => (
                <button key={m.id} onClick={() => handleInsert(m.id, m.position)} disabled={loading}
                  className="w-full text-left px-3 py-2.5 card hover:shadow-card-hover rounded-lg text-xs text-gray-700 transition-all disabled:opacity-50 flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <span>{m.icon}</span>
                    <span className="font-medium">{m.label}</span>
                  </span>
                  <span className="text-[10px] text-gray-300 group-hover:text-bookify-500 transition-colors">+ Insert</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
