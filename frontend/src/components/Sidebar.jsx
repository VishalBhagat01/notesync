import { useState, useMemo, memo } from "react";
import ThemeToggle from "./ThemeToggle";

// Memoized individual note card to prevent re-rendering all items when one note updates
const NoteCard = memo(function NoteCard({ note, isSelected, onSelectNote, onDeleteNote }) {
  const canDelete = note.is_owner !== false;

  return (
    <div className="group relative mb-1.5">
      <button
        onClick={() => onSelectNote(note.id)}
        className={`w-full rounded-xl border p-3 pr-16 text-left transition-all duration-150 relative overflow-hidden ${
          isSelected
            ? "border-[#ff6600]/40 bg-[var(--bg-input)] shadow-sm"
            : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-input)]"
        }`}
      >
        {/* Left Orange Accent Line for Active Note */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6600]" />
        )}

        <div className="flex items-center gap-2 pl-0.5">
          <h3
            className={`truncate text-xs font-semibold tracking-tight ${
              isSelected
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
            }`}
          >
            {note.title || "Untitled Note"}
          </h3>
        </div>

        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] pl-0.5">
          {note.content || "No content..."}
        </p>
      </button>

      {note.is_owner === false && (
        <span className="pointer-events-none absolute right-2.5 top-2.5 shrink-0 rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-orange-500">
          Shared
        </span>
      )}

      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNote(note.id);
          }}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-transparent px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] transition-all duration-150 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 focus:opacity-100 ${
            isSelected ? "opacity-75 hover:opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          title="Delete note"
          aria-label="Delete note"
        >
          Delete
        </button>
      )}
    </div>
  );
});

function Sidebar({
  notes = [],
  selectedNoteId,
  loading = false,
  onSelectNote,
  onCreateNote,
  onLogout,
  onDeleteNote,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return notes;
    return notes.filter(
      (n) =>
        (n.title || "").toLowerCase().includes(term) ||
        (n.content || "").toLowerCase().includes(term)
    );
  }, [notes, searchTerm]);

  const myNotes = useMemo(
    () => filteredNotes.filter((n) => n.is_owner !== false),
    [filteredNotes]
  );
  const sharedNotes = useMemo(
    () => filteredNotes.filter((n) => n.is_owner === false),
    [filteredNotes]
  );

  return (
    <aside className="flex h-screen w-80 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-4 select-none transition-colors duration-200">
      {/* Brand Header with NoteSync Notebook Icon */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff6600] text-white shadow-sm shadow-orange-500/20">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              NoteSync
            </h3>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />
      </div>

      {/* New Note Action (Signature Orange CTA) */}
      <button
        onClick={onCreateNote}
        className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff6600] hover:bg-[#ff7a1a] text-white px-3.5 py-2 text-xs font-semibold shadow-sm shadow-orange-950/20 hover:shadow-orange-500/25 transition-all duration-150 active:scale-[0.98]"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
        New Note
      </button>

      {/* Search Input */}
      <div className="mt-3 relative">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 pl-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/30"
        />
        <svg
          className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Scrollable Note Lists */}
      <div className="mt-4 flex-1 overflow-y-auto pr-0.5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-[var(--text-muted)] animate-pulse">Loading notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[var(--text-muted)]">No notes found</p>
          </div>
        ) : (
          <>
            {/* My Notes */}
            {myNotes.length > 0 && (
              <div>
                <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  My Notes ({myNotes.length})
                </h2>
                {myNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onSelectNote={onSelectNote}
                    onDeleteNote={onDeleteNote}
                  />
                ))}
              </div>
            )}

            {/* Shared Notes */}
            {sharedNotes.length > 0 && (
              <div>
                <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Shared With Me ({sharedNotes.length})
                </h2>
                {sharedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onSelectNote={onSelectNote}
                    onDeleteNote={onDeleteNote}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer / Logout */}
      <div className="pt-3 border-t border-[var(--border-subtle)]">
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
