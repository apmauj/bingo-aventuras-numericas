// ============================================================
// Custom hook for Socket.io connection management
// ============================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ConnectionState } from '@/types/bingo';
import { logger } from '@/lib/logger';

// Module-level socket reference so other components can access it
let _activeSocket: Socket | null = null;

export function getActiveSocket(): Socket | null {
  return _activeSocket;
}

interface UseSocketReturn {
  connectionState: ConnectionState;
  emit: <T>(event: string, data?: T) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    // Determine the Socket.io server URL.
    // - In development: connect directly to the backend at localhost:3003
    // - In production: use NEXT_PUBLIC_SERVER_URL env var (set at build time)
    //   or fall back to localStorage (useful for testing different backends)
    const isDev = typeof window !== 'undefined' && window.location.port === '3000';
    let serverUrl: string | undefined;

    if (isDev) {
      serverUrl = 'http://localhost:3003';
    } else {
      serverUrl = (window as any).__BINGO_SERVER__
        || localStorage.getItem('bingo_server')
        || process.env.NEXT_PUBLIC_SERVER_URL
        || undefined;
    }

    const socket = io(serverUrl || undefined, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    _activeSocket = socket;

    socket.on('connect', () => {
      logger.debug('[Socket] Connected:', socket.id);
      setConnectionState('connected');
    });

    socket.on('disconnect', (reason) => {
      logger.debug('[Socket] Disconnected:', reason);
      setConnectionState('disconnected');
    });

    socket.on('connect_error', (error) => {
      logger.error('[Socket] Connection error:', error.message);
      setConnectionState('connecting');
    });

    socket.on('reconnect_attempt', (attempt) => {
      logger.debug('[Socket] Reconnection attempt:', attempt);
      setConnectionState('connecting');
    });

    socket.on('reconnect_failed', () => {
      logger.error('[Socket] Reconnection failed');
      setConnectionState('disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      _activeSocket = null;
    };
  }, []);

  const emit = useCallback(<T,>(event: string, data?: T) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      logger.warn('[Socket] Cannot emit, socket not connected');
    }
  }, []);

  return {
    connectionState,
    emit,
  };
}
