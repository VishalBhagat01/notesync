// NoteEditor is a presentational component; autosave is handled in Dashboard

function NoteEditor({
  selectedNote,
  saving,
  onChange,
  onSave,
  onDelete,
}) {


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
    <main className="flex-1 p-8 bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Title */}
        <input
          name="title"
          value={selectedNote.title}
          onChange={onChange}
          placeholder="Untitled Note"
          className="w-full bg-transparent text-5xl font-bold tracking-tight placeholder:text-zinc-600 outline-none border-b border-zinc-800 pb-4 focus:border-violet-500 transition-colors"
        />

        {/* Content */}
        <textarea
          name="content"
          value={selectedNote.content}
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
    </main>
  );
}

export default NoteEditor;