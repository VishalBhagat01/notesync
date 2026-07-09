function Sidebar({
  notes,
  selectedNote,
  loading,
  onSelectNote,
  onCreateNote,
  onLogout,
}) {
  return (
    <aside style={{ width: "280px", padding: "20px", borderRight: "1px solid #ddd" }}>
      <h2>NoteFlow</h2>

      <button onClick={onCreateNote}>+ New Note</button>
      <button onClick={onLogout} style={{ marginLeft: "10px" }}>
        Logout
      </button>

      {loading ? (
        <p>Loading notes...</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                marginBottom: "8px",
                padding: "10px",
                background: selectedNote?.id === note.id ? "#e5e7eb" : "white",
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
            >
              {note.title}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;