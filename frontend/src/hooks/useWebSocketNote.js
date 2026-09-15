import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Robust, high-concurrency WebSocket hook for real-time collaborative note editing.
 * Features:
 * - Trailing-edge throttling for outgoing keystrokes (prevents socket flooding)
 * - Exponential backoff auto-reconnection with jitter
 * - Heartbeat ping to prevent proxy/NAT idle disconnection
 * - Ref-stabilized callbacks to prevent unneeded socket reconnections
 */
export function useWebSocketNote(noteId, onNoteRemoteUpdate, onPresenceUpdate) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

  // Stabilize callbacks to avoid re-triggering socket connection effect
  const onNoteRemoteUpdateRef = useRef(onNoteRemoteUpdate);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);
  useEffect(() => {
    onNoteRemoteUpdateRef.current = onNoteRemoteUpdate;
  }, [onNoteRemoteUpdate]);
  useEffect(() => {
    onPresenceUpdateRef.current = onPresenceUpdate;
  }, [onPresenceUpdate]);

  // Outgoing edit throttle refs
  const pendingEditRef = useRef(null);
  const throttleTimerRef = useRef(null);

  // Auto-reconnection & heartbeat refs
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const isManuallyClosedRef = useRef(false);

  // Flush any queued throttled edits immediately to socket
  const flushPendingEdit = useCallback(() => {
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    if (
      pendingEditRef.current &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      socketRef.current.send(
        JSON.stringify({
          type: "edit",
          ...pendingEditRef.current,
        })
      );
      pendingEditRef.current = null;
    }
  }, []);

  useEffect(() => {
    isManuallyClosedRef.current = false;
    reconnectAttemptRef.current = 0;

    if (!noteId) {
      if (socketRef.current) {
        isManuallyClosedRef.current = true;
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      setConnectionStatus("disconnected");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setConnectionStatus("disconnected");
      return;
    }

    let isMounted = true;

    const connectWebSocket = () => {
      if (!isMounted) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//localhost:8000/notes/ws/${noteId}?token=${encodeURIComponent(token)}`;

      setConnectionStatus(reconnectAttemptRef.current > 0 ? "reconnecting" : "connecting");

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptRef.current = 0;

        // Start heartbeat ping every 25s to keep connection alive through NAT/proxies
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);

        // If there were pending edits queued while reconnecting, flush them now
        flushPendingEdit();
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") {
            return; // Heartbeat acknowledgment
          } else if (data.type === "edit" && onNoteRemoteUpdateRef.current) {
            onNoteRemoteUpdateRef.current(data);
          } else if (data.type === "presence" && onPresenceUpdateRef.current) {
            onPresenceUpdateRef.current(data.users || []);
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      ws.onclose = (event) => {
        clearInterval(heartbeatIntervalRef.current);
        if (!isMounted) return;
        setIsConnected(false);

        // Do not auto-reconnect if client manually navigated away or closed connection
        if (isManuallyClosedRef.current) {
          setConnectionStatus("disconnected");
          return;
        }

        // 4001/4003 = Auth failure / forbidden, do not retry
        if (event.code === 4001 || event.code === 4003) {
          setConnectionStatus("disconnected");
          return;
        }

        setConnectionStatus("reconnecting");

        // Exponential backoff: 1s, 2s, 4s, 8s, max 15s + jitter
        const baseDelay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 15000);
        const jitter = Math.floor(Math.random() * 500);
        const nextDelay = baseDelay + jitter;
        reconnectAttemptRef.current += 1;

        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted && !isManuallyClosedRef.current) {
            connectWebSocket();
          }
        }, nextDelay);
      };

      ws.onerror = () => {
        // ws.onclose handles retry logic
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      isManuallyClosedRef.current = true;
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(heartbeatIntervalRef.current);
      flushPendingEdit();
      if (socketRef.current) {
        if (
          socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING
        ) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }
    };
  }, [noteId, flushPendingEdit]);

  // Throttled outgoing edit transmitter (batches keystrokes to ~60ms intervals)
  const sendEdit = useCallback((title, content) => {
    pendingEditRef.current = { title, content };

    if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        if (
          pendingEditRef.current &&
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "edit",
              ...pendingEditRef.current,
            })
          );
          pendingEditRef.current = null;
        }
      }, 60); // 60ms throttle window allows smooth typing while reducing message volume by 80%
    }
  }, []);

  return { isConnected, connectionStatus, sendEdit, flushPendingEdit };
}
