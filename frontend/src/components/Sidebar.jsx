function Sidebar({
  notes,
  selectedNote,
  loading,
  onSelectNote,
  onCreateNote,
  onLogout,
}) {
  return (
    <aside className="flex h-screen w-80 flex-col border-r border-zinc-800 bg-zinc-950 p-6">
    {/* Header */}
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
        NoteFlow
      </h1>

      <button
        onClick={onCreateNote}
        className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
      >
        + New Note
      </button>
    </div>

    {/* Notes */}
    <div className="mt-6 flex-1 overflow-y-auto pr-1">
      {loading ? (
        <p className="text-sm text-zinc-500">Loading notes...</p>
      ) : (
        notes.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`group relative mb-3 w-full rounded-xl border px-4 py-3 text-left transition-all duration-200
              ${
                selectedNote?.id === note.id
                  ? "border-violet-500 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
              }`}
          >
            <h3
              className={`truncate text-sm font-semibold ${
                selectedNote?.id === note.id
                  ? "text-white"
                  : "text-zinc-200"
              }`}
            >
              {note.title || "Untitled"}
            </h3>

            <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
              {note.content || "No content"}
            </p>

            {selectedNote?.id === note.id && (
              <span className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50" />
            )}
          </button>
        ))
      )}
    </div>

    {/* Logout */}
    <button
      onClick={onLogout}
      className="mt-6 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-4 font-medium text-red-400 transition-all duration-200 hover:border-red-400 hover:bg-red-500/20"
    >
      Logout
    </button>
  </aside>
  );
}

export default Sidebar;