import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocketNote(noteId, onNoteRemoteUpdate, onPresenceUpdate) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!noteId) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Convert http/https API URL or default port 8000 to WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//localhost:8000/notes/ws/${noteId}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "edit" && onNoteRemoteUpdate) {
          onNoteRemoteUpdate(data);
        } else if (data.type === "presence" && onPresenceUpdate) {
          onPresenceUpdate(data.users);
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [noteId]);

  const sendEdit = useCallback((title, content) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "edit",
          title,
          content,
        })
      );
    }
  }, []);

  return { isConnected, sendEdit };
}
