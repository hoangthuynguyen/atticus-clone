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
  const [activeSection, setActiveSection] = useState<'chapters' | 'versions'>('chapters');

  return (
    <div className="p-3 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800">Structure</h2>

      <div className="flex gap-1">
        <button
          onClick={() => setActiveSection('chapters')}
          className={`flex-1 px-2 py-1 rounded text-[11px] font-medium
            ${activeSection === 'chapters' ? 'bg-atticus-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Chapters
        </button>
        <button
          onClick={() => setActiveSection('versions')}
          className={`flex-1 px-2 py-1 rounded text-[11px] font-medium
            ${activeSection === 'versions' ? 'bg-atticus-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Versions
        </button>
      </div>

      {activeSection === 'chapters' && <ChapterList />}
      {activeSection === 'versions' && <VersionManager />}
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
          className="flex-1 p-1.5 border rounded text-xs"
          onKeyDown={(e) => e.key === 'Enter' && handleCreateVersion()}
        />
        <button
          onClick={handleCreateVersion}
          disabled={saving || !newVersionName.trim()}
          className="px-3 py-1.5 bg-atticus-600 text-white rounded text-xs font-medium disabled:opacity-50"
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
