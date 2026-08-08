// NoteEditor is a presentational component; autosave is handled in Dashboard

import { useState } from "react";

function NoteEditor({
  selectedNote,
  saving,
  activeUsers = [],
  isConnected = false,
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

  if (!selectedNote) {
    return (
      <main className="w-full h-full flex-1 flex items-center justify-center bg-zinc-950">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-violet-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-10 w-10 text-violet-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z"
              />
            </svg>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            What's on your mind?
          </h1>

          <p className="mt-4 text-lg text-zinc-400">
            Select a note from the sidebar or create a new one to start writing.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 bg-zinc-950 text-white relative">
      <div className="mx-auto max-w-4xl">
        {/* Active Collaborators Bar */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
              }`}
            />
            <span className="text-xs font-medium text-zinc-400">
              {isConnected ? "Live Sync Connected" : "Connecting sync..."}
            </span>
          </div>

          {/* User Presence Avatars & Share button */}
          <div className="flex items-center gap-4">
            {activeUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">Collaborating:</span>
                <div className="flex -space-x-2 overflow-hidden">
                  {activeUsers.map((user) => (
                    <div
                      key={user.id}
                      title={user.name || user.email}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 ring-2 ring-zinc-950 text-xs font-bold text-white uppercase"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>

            <button
              onClick={() => {
                setShareStatus({ loading: false, msg: "", isError: false });
                setShowShareModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Share Note
            </button>
          </div>
        </div>


        {/* Title */}
        <input
          name="title"
          value={selectedNote.title || ""}
          onChange={onChange}
          placeholder="Untitled Note"
          className="w-full bg-transparent text-5xl font-bold tracking-tight placeholder:text-zinc-600 outline-none border-b border-zinc-800 pb-4 focus:border-violet-500 transition-colors"
        />

        {/* Content */}
        <textarea
          name="content"
          value={selectedNote.content || ""}
          onChange={onChange}
          placeholder="Start writing your thoughts..."
          className="mt-8 w-full min-h-[450px] bg-transparent text-lg leading-8 text-zinc-300 placeholder:text-zinc-600 outline-none resize-none"
        />

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-6">
          <div className="flex gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-2.5 font-medium text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={onDelete}
              className="rounded-xl border border-red-500/40 px-5 py-2.5 font-medium text-red-400 transition-all hover:bg-red-500/10 hover:border-red-400"
            >
              Delete
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <div
              className={`h-2 w-2 rounded-full ${
                saving ? "bg-yellow-400 animate-pulse" : "bg-emerald-400"
              }`}
            />
            <span>{saving ? "Saving..." : "All changes saved"}</span>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Share Note</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Invite team members by email to collaborate in real-time.
            </p>

            <form onSubmit={handleShareSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="colleague@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              />

              {shareStatus.msg && (
                <div
                  className={`rounded-lg px-3 py-2 text-xs ${
                    shareStatus.isError
                      ? "bg-red-500/10 border border-red-500/30 text-red-400"
                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {shareStatus.msg}
                </div>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shareStatus.loading}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
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
        <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-zinc-800 bg-zinc-900 p-6 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Version History
            </h3>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Track real-time revisions and who made updates to this note.
          </p>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {historyList.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No history recorded yet.</p>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-violet-400 truncate max-w-[170px]">
                      {item.user_email || "Collaborator"}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="mt-1 text-sm font-medium text-zinc-200 truncate">
                    {item.title || "Untitled"}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                    {item.content || "No content"}
                  </p>

                  <button
                    onClick={async () => {
                      if (onRestoreVersion) {
                        await onRestoreVersion(selectedNote.id, item.id);
                        setShowHistoryDrawer(false);
                      }
                    }}
                    className="mt-3 w-full rounded-lg bg-zinc-800 py-1.5 text-xs font-medium text-zinc-300 hover:bg-violet-600 hover:text-white transition-colors"
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

export default NoteEditor;