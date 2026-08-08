import { useState } from "react";

function Sidebar({
  notes,
  selectedNote,
  loading,
  onSelectNote,
  onCreateNote,
  onLogout,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotes = notes.filter((n) =>
    (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.content || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myNotes = filteredNotes.filter((n) => n.is_owner !== false);
  const sharedNotes = filteredNotes.filter((n) => n.is_owner === false);

  const renderNoteCard = (note) => {
    const isSelected = selectedNote?.id === note.id;
    return (
      <button
        key={note.id}
        onClick={() => onSelectNote(note.id)}
        className={`group relative mb-2 w-full rounded-2xl border p-3.5 text-left transition-all duration-200 ${
          isSelected
            ? "border-violet-500/50 bg-violet-600/10 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30"
            : "border-zinc-900 bg-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-900"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`truncate text-sm font-semibold tracking-tight ${
              isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"
            }`}
          >
            {note.title || "Untitled Note"}
          </h3>
          {note.is_owner === false && (
            <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
              Shared
            </span>
          )}
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400">
          {note.content || "No content..."}
        </p>

        {isSelected && (
          <span className="absolute right-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-400 shadow-md shadow-violet-400/80" />
        )}
      </button>
    );
  };

  return (
    <aside className="flex h-screen w-80 flex-col border-r border-zinc-900 bg-zinc-950/95 backdrop-blur-xl p-5 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent">
              NoteSync
            </h1>
          </div>
        </div>
      </div>

      {/* New Note Action */}
      <button
        onClick={onCreateNote}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/30 active:scale-[0.98]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
        New Note
      </button>

      {/* Search Input */}
      <div className="mt-4 relative">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-zinc-900 bg-zinc-900/60 px-3.5 py-2 pl-9 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-violet-500/50 focus:bg-zinc-900"
        />
        <svg className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Scrollable Note Lists */}
      <div className="mt-5 flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-zinc-500 animate-pulse">Loading notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-zinc-500">No notes found</p>
          </div>
        ) : (
          <>
            {/* My Notes */}
            {myNotes.length > 0 && (
              <div>
                <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  My Notes ({myNotes.length})
                </h2>
                {myNotes.map(renderNoteCard)}
              </div>
            )}

            {/* Shared Notes */}
            {sharedNotes.length > 0 && (
              <div>
                <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Shared With Me ({sharedNotes.length})
                </h2>
                {sharedNotes.map(renderNoteCard)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-zinc-900">
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900/40 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
