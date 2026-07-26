import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import NoteEditor from "../components/NoteEditor";

import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../api/notesApi";

function Dashboard() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveTimeoutRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setError("Could not load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSelectNote = async (noteId) => {
    try {
      setError("");

      const note = await getNoteById(noteId);

      isFirstLoadRef.current = true;
      setSelectedNote(note);
    } catch (err) {
      setError("Could not open note");
    }
  };

  const handleCreateNote = async () => {
    try {
      setError("");

      const newNote = await createNote({
        title: "Untitled Note",
        content: "",
      });

      setNotes((currentNotes) => [newNote, ...currentNotes]);

      isFirstLoadRef.current = true;
      setSelectedNote(newNote);
    } catch (err) {
      setError("Could not create note");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setSelectedNote((currentNote) => ({
      ...currentNote,
      [name]: value,
    }));
  };

  const saveCurrentNote = async () => {
    if (!selectedNote) return;

    try {
      setSaving(true);
      setError("");

      const updatedNote = await updateNote(selectedNote.id, {
        title: selectedNote.title,
        content: selectedNote.content,
      });

      setSelectedNote(updatedNote);

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === updatedNote.id ? updatedNote : note
        )
      );
    } catch (err) {
      setError("Could not save note");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    clearTimeout(saveTimeoutRef.current);
    await saveCurrentNote();
  };

  useEffect(() => {
    if (!selectedNote) return;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentNote();
    }, 1500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [selectedNote?.title, selectedNote?.content]);

  const handleDelete = async () => {
    if (!selectedNote) return;

    const shouldDelete = window.confirm(
      `Delete "${selectedNote.title}"?`
    );

    if (!shouldDelete) return;

    try {
      setError("");

      await deleteNote(selectedNote.id);

      setNotes((currentNotes) =>
        currentNotes.filter((note) => note.id !== selectedNote.id)
      );

      clearTimeout(saveTimeoutRef.current);
      setSelectedNote(null);
    } catch (err) {
      setError("Could not delete note");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="flex w-screen h-screen">
      <Sidebar
        notes={notes}
        selectedNote={selectedNote}
        loading={loading}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col">
        {error && (
          <div className="mx-8 mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <NoteEditor
          selectedNote={selectedNote}
          saving={saving}
          onChange={handleChange}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default Dashboard;