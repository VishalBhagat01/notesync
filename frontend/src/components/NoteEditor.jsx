function NoteEditor({
  selectedNote,
  saving,
  onChange,
  onSave,
  onDelete,
}) {
  if (!selectedNote) {
    return (
      <main style={{ padding: "30px" }}>
        <h1>Select a note or create one</h1>
        <p>Your editor will appear here.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "30px" }}>
      <input
        name="title"
        value={selectedNote.title}
        onChange={onChange}
        placeholder="Note title"
        style={{
          width: "100%",
          fontSize: "28px",
          padding: "10px",
          marginBottom: "20px",
        }}
      />

      <textarea
        name="content"
        value={selectedNote.content}
        onChange={onChange}
        placeholder="Write your note..."
        style={{
          width: "100%",
          minHeight: "350px",
          padding: "12px",
          fontSize: "16px",
          resize: "vertical",
        }}
      />

      <div style={{ marginTop: "16px" }}>
        <button onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          onClick={onDelete}
          style={{ marginLeft: "10px", color: "crimson" }}
        >
          Delete
        </button>

        <span style={{ marginLeft: "12px", color: "#666" }}>
          {saving ? "Saving..." : "Saved"}
        </span>
      </div>
    </main>
  );
}

export default NoteEditor;