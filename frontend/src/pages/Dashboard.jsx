import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import NoteEditor from "../components/NoteEditor";
import { useWebSocketNote } from "../hooks/useWebSocketNote";

import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
  shareNote,
  getNoteHistory,
  restoreNoteVersion,
} from "../api/notesApi";

function Dashboard() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [historyList, setHistoryList] = useState([]);

  const handleShareNote = async (noteId, email) => {
    return await shareNote(noteId, email);
  };

  const handleFetchHistory = async (noteId) => {
    try {
      const data = await getNoteHistory(noteId);
      setHistoryList(data || []);
    } catch (err) {
      console.error("Could not fetch history", err);
    }
  };

  const handleRestoreVersion = async (noteId, historyId) => {
    try {
      const restored = await restoreNoteVersion(noteId, historyId);
      if (restored) {
        setSelectedNote(restored);
        setNotes((currentNotes) =>
          currentNotes.map((note) => (note.id === restored.id ? restored : note))
        );
      }
    } catch (err) {
      setError("Could not restore version");
    }
  };



  const saveTimeoutRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const isRemoteUpdateRef = useRef(false);

  // Callback when remote socket sends live edit updates
  const handleRemoteUpdate = useCallback((data) => {
    isRemoteUpdateRef.current = true;
    setSelectedNote((current) => {
      if (!current || current.id !== data.note_id) return current;
      return {
        ...current,
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
      };
    });
  }, []);

  const handlePresenceUpdate = useCallback((users) => {
    setActiveUsers(users);
  }, []);

  const { isConnected, sendEdit } = useWebSocketNote(
    selectedNote?.id,
    handleRemoteUpdate,
    handlePresenceUpdate
  );

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

    setSelectedNote((currentNote) => {
      const nextNote = {
        ...currentNote,
        [name]: value,
      };
      
      // Send real-time change over WebSocket to connected peers
      if (isConnected) {
        sendEdit(nextNote.title, nextNote.content);
      }
      return nextNote;
    });
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

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
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
          activeUsers={activeUsers}
          isConnected={isConnected}
          onChange={handleChange}
          onSave={handleSave}
          onDelete={handleDelete}
          onShare={handleShareNote}
          onFetchHistory={handleFetchHistory}
          onRestoreVersion={handleRestoreVersion}
          historyList={historyList}
        />


      </div>
    </div>
  );
}

export default Dashboard;
