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

  const saveTimeoutRef = useRef(null);
  const sidebarSyncTimeoutRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const isRemoteUpdateRef = useRef(false);

  // Sync active note title/preview to sidebar notes list with a 800ms debounce
  // This prevents re-mapping and filtering the full notes array on every single keystroke
  const scheduleSidebarSync = useCallback((noteId, title, content) => {
    clearTimeout(sidebarSyncTimeoutRef.current);
    sidebarSyncTimeoutRef.current = setTimeout(() => {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId
            ? { ...note, title: title ?? note.title, content: content ?? note.content }
            : note
        )
      );
    }, 800);
  }, []);

  // Callback when remote socket sends live edit updates
  const handleRemoteUpdate = useCallback(
    (data) => {
      isRemoteUpdateRef.current = true;
      setSelectedNote((current) => {
        if (!current || current.id !== data.note_id) return current;
        return {
          ...current,
          ...(data.title !== undefined && { title: data.title }),
          ...(data.content !== undefined && { content: data.content }),
        };
      });

      scheduleSidebarSync(data.note_id, data.title, data.content);
    },
    [scheduleSidebarSync]
  );

  const handlePresenceUpdate = useCallback((users) => {
    setActiveUsers(users);
  }, []);

  const { isConnected, connectionStatus, sendEdit, flushPendingEdit } = useWebSocketNote(
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
    // If switching notes, flush any pending edit for current note first
    flushPendingEdit();
    clearTimeout(saveTimeoutRef.current);
    clearTimeout(sidebarSyncTimeoutRef.current);

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
    flushPendingEdit();
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

      // Broadcast real-time change over throttled WebSocket to connected peers
      if (isConnected) {
        sendEdit(nextNote.title, nextNote.content);
      }

      // Schedule low-overhead sidebar preview update
      scheduleSidebarSync(nextNote.id, nextNote.title, nextNote.content);

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
    flushPendingEdit();
    await saveCurrentNote();
  };

  // HTTP Autosave Fallback:
  // CRITICAL CONCURRENCY FIX: Only schedule HTTP autosave if WebSocket is NOT connected (offline fallback).
  // When WebSocket is connected, real-time sync is active and delayed HTTP PATCH calls cause
  // race conditions that overwrite concurrent peer edits.
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

    // Suppress HTTP autosave if live sync via WebSocket is active
    if (isConnected) {
      clearTimeout(saveTimeoutRef.current);
      return;
    }

    // Fallback: If offline or disconnected, save via HTTP after 1.5s idle
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentNote();
    }, 1500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [selectedNote?.title, selectedNote?.content, isConnected]);

  const handleDelete = async (noteId = null) => {
    const targetId = noteId ?? selectedNote?.id;
    if (!targetId) return;

    const targetNote = notes.find((note) => note.id === targetId) || selectedNote;
    const targetTitle = targetNote?.title || "this note";

    const shouldDelete = window.confirm(`Delete "${targetTitle}"?`);
    if (!shouldDelete) return;

    try {
      setError("");
      await deleteNote(targetId);

      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== targetId));

      if (selectedNote?.id === targetId) {
        clearTimeout(saveTimeoutRef.current);
        setSelectedNote(null);
      }
    } catch (err) {
      setError("Could not delete note");
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="flex w-screen h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden transition-colors duration-200">
      <Sidebar
        notes={notes}
        selectedNoteId={selectedNote?.id}
        loading={loading}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onLogout={handleLogout}
        onDeleteNote={handleDelete}
      />

      <div className="flex flex-1 flex-col bg-[var(--bg-canvas)] overflow-hidden">
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
          connectionStatus={connectionStatus}
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
