import { useState, useRef, useEffect, useMemo, memo } from "react";

const AVATAR_COLORS = [
  "bg-[#ff6600]",
  "bg-amber-600",
  "bg-orange-700",
  "bg-stone-700",
  "bg-zinc-700",
];

function NoteEditor({
  selectedNote,
  saving,
  activeUsers = [],
  isConnected = false,
  connectionStatus = "connected", // 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  onChange,
  onSave,
  onDelete,
  onShare,
  onFetchHistory,
  onRestoreVersion,
  historyList = [],
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState({ loading: false, msg: "", isError: false });

  // Refs for inputs to preserve cursor position during concurrent remote edits
  const textareaRef = useRef(null);
  const titleInputRef = useRef(null);
  const cursorContentRef = useRef({ start: 0, end: 0 });

  // Word and character count stats
  const stats = useMemo(() => {
    if (!selectedNote?.content) return { words: 0, chars: 0, readTime: "< 1 min" };
    const text = selectedNote.content.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readTime = Math.max(1, Math.ceil(words / 200)) + " min read";
    return { words, chars, readTime };
  }, [selectedNote?.content]);

  // Formatted date stamp for the notebook page
  const pageDate = useMemo(() => {
    const d = selectedNote?.updated_at ? new Date(selectedNote.updated_at) : new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedNote?.updated_at]);

  // Track cursor position on local selection/keystrokes
  const handleContentSelect = (e) => {
    cursorContentRef.current = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    };
  };

  // Restore cursor if remote update arrived while focused
  useEffect(() => {
    if (textareaRef.current && document.activeElement === textareaRef.current) {
      const { start, end } = cursorContentRef.current;
      const maxLen = textareaRef.current.value.length;
      const targetStart = Math.min(start, maxLen);
      const targetEnd = Math.min(end, maxLen);
      textareaRef.current.setSelectionRange(targetStart, targetEnd);
    }
  }, [selectedNote?.content]);

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim() || !onShare) return;
    try {
      setShareStatus({ loading: true, msg: "", isError: false });
      const res = await onShare(selectedNote.id, shareEmail.trim());
      setShareStatus({ loading: false, msg: res.message || "Shared successfully!", isError: false });
      setShareEmail("");
    } catch (err) {
      setShareStatus({
        loading: false,
        msg: err.response?.data?.detail || "Could not share note",
        isError: true,
      });
    }
  };

  // Empty State: Clean notebook waiting on the desk
  if (!selectedNote) {
    return (
      <main className="w-full h-full flex-1 flex items-center justify-center bg-[var(--bg-canvas)] p-8 desk-dots select-none transition-colors duration-200">
        <div className="max-w-md w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-lg transition-all duration-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-[#ff6600] border border-orange-500/20 shadow-sm">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Your Digital Notebook
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            Select a note from the sidebar or create a new page to write notes, architectural specs, or daily journals with real-time sync.
          </p>
        </div>
      </main>
    );
  }

  // Connection badge status text and styling
  const connectionBadge = {
    connected: { color: "bg-emerald-500", text: "Live sync active" },
    reconnecting: { color: "bg-amber-500 animate-pulse", text: "Reconnecting sync..." },
    connecting: { color: "bg-blue-500 animate-pulse", text: "Connecting..." },
    disconnected: { color: "bg-zinc-500", text: "Saved locally" },
  }[connectionStatus] || { color: "bg-zinc-500", text: "Ready" };

  return (
    <main className="flex-1 bg-[var(--bg-canvas)] p-6 relative flex flex-col h-screen overflow-hidden desk-dots transition-colors duration-200">
      {/* Top Desk Toolbar */}
      <div className="mx-auto max-w-4xl w-full mb-3 flex items-center justify-between">
        {/* Status Pill */}
        <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1 shadow-xs">
          <span className={`h-2 w-2 rounded-full ${connectionBadge.color}`} />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {connectionBadge.text}
          </span>
          {saving && (
            <span className="text-[11px] font-medium text-amber-500 animate-pulse pl-1">
              • Saving...
            </span>
          )}
        </div>

        {/* Action Controls & Collaborator Presence */}
        <div className="flex items-center gap-2.5">
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 py-0.5 shadow-xs">
              <span className="text-[10px] text-[var(--text-muted)] font-medium">Collaborating:</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {activeUsers.map((user, idx) => (
                  <div
                    key={user.id}
                    title={user.name || user.email}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                      AVATAR_COLORS[idx % AVATAR_COLORS.length]
                    } ring-1 ring-[var(--bg-card)] text-[9px] font-bold text-white uppercase`}
                  >
                    {(user.name || user.email || "U")[0]}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (onFetchHistory) onFetchHistory(selectedNote.id);
              setShowHistoryDrawer(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] shadow-xs transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-[#ff6600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>

          <button
            onClick={() => {
              setShareStatus({ loading: false, msg: "", isError: false });
              setShowShareModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] shadow-xs transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-[#ff6600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Share
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-[#ff6600] hover:bg-[#ff7a1a] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={onDelete}
            className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/15 transition-all"
            title="Delete this note"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* THE NOTEBOOK PAGE CONTAINER */}
      <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col rounded-2xl border border-[var(--border-subtle)] notebook-sheet relative overflow-hidden transition-all duration-200">
        {/* Notebook Spiral / Binder Spine on Left */}
        <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-dashed border-[var(--border-subtle)] flex flex-col items-center justify-around py-8 pointer-events-none select-none opacity-60">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] shadow-inner"
            />
          ))}
        </div>

        {/* Notebook Page Header with Date and Meta */}
        <div className="pl-12 pr-6 pt-4 pb-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono select-none">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#ff6600]">NOTE // PAGE</span>
            <span className="text-[var(--border-subtle)]">|</span>
            <span>{pageDate}</span>
          </div>

          <div className="flex items-center gap-3">
            <span>{stats.words} words</span>
            <span>•</span>
            <span>{stats.chars} chars</span>
            <span>•</span>
            <span>{stats.readTime}</span>
          </div>
        </div>

        {/* Notebook Writing Sheet with Left Margin Guide and Ruled Paper Lines */}
        <div className="flex-1 flex pl-12 pr-6 py-4 overflow-hidden relative">
          {/* Classic Notebook Left Margin Guideline */}
          <div className="w-3 notebook-margin-guide shrink-0 mr-4" />

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Note Title */}
            <input
              ref={titleInputRef}
              name="title"
              value={selectedNote.title || ""}
              onChange={onChange}
              placeholder="Untitled Note"
              className="w-full bg-transparent text-2xl font-bold tracking-tight text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none border-b border-[var(--border-subtle)] pb-2 mb-2 transition-colors focus:border-[#ff6600]"
            />

            {/* Note Body Textarea with Notebook Ruled Lines */}
            <textarea
              ref={textareaRef}
              name="content"
              value={selectedNote.content || ""}
              onChange={onChange}
              onSelect={handleContentSelect}
              onKeyUp={handleContentSelect}
              onClick={handleContentSelect}
              placeholder="Write your note here... every thought stays in sync."
              className="w-full flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none notebook-ruled-textarea selection:bg-[#ff6600]/25 pt-1"
            />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ff6600] text-white">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Share Notebook Page</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Invite a colleague by email to co-author this note in real-time.
            </p>

            <form onSubmit={handleShareSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="colleague@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20"
              />

              {shareStatus.msg && (
                <div
                  className={`rounded-lg px-3 py-2 text-xs ${
                    shareStatus.isError
                      ? "bg-red-500/10 border border-red-500/30 text-red-500"
                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                  }`}
                >
                  {shareStatus.msg}
                </div>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shareStatus.loading}
                  className="rounded-lg bg-[#ff6600] hover:bg-[#ff7a1a] px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors shadow-xs"
                >
                  {shareStatus.loading ? "Sharing..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-88 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-2xl flex flex-col transition-all">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <svg className="w-4 h-4 text-[#ff6600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Notebook History
            </h3>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
            Previous revisions saved for this notebook page.
          </p>

          <div className="mt-3.5 flex-1 overflow-y-auto space-y-2.5 pr-0.5">
            {historyList.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No history recorded yet.</p>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] p-3 transition-all hover:border-[var(--border-hover)]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#ff6600] truncate max-w-[160px] text-[11px]">
                      {item.user_email || "Collaborator"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="mt-1 text-xs font-medium text-[var(--text-primary)] truncate">
                    {item.title || "Untitled"}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-secondary)]">
                    {item.content || "No content"}
                  </p>

                  <button
                    onClick={async () => {
                      if (onRestoreVersion) {
                        await onRestoreVersion(selectedNote.id, item.id);
                        setShowHistoryDrawer(false);
                      }
                    }}
                    className="mt-2.5 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] py-1 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[#ff6600] hover:text-white hover:border-[#ff6600] transition-colors"
                  >
                    Restore this version
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default memo(NoteEditor);