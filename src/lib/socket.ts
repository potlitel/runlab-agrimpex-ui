import { io, type Socket } from 'socket.io-client'

// En desarrollo no hay VITE_API_URL: se usa el mismo origen y el proxy de
// Vite (/socket.io -> :3001). En Docker/CI la API se expone en otra URL;
// derivamos el origen del socket de VITE_API_URL para no necesitar otra
// variable, con VITE_SOCKET_URL como override explícito.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (API_BASE_URL.startsWith('http') ? new URL(API_BASE_URL).origin : undefined)

let socket: Socket | null = null
let currentProfileId: string | null = null
let listenersBound = false

function bindLifecycleEvents(sock: Socket) {
  if (listenersBound) return
  listenersBound = true
  sock.on('connect', () => {
    // Al conectar o reconectar, re-unirse a la sala del perfil activo
    if (currentProfileId) {
      sock.emit('profile:join', currentProfileId)
    }
  })
}

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
    })
    bindLifecycleEvents(socket)
  }
  return socket
}

export function connect(profileId?: string): Socket {
  const sock = getSocket()
  if (profileId) {
    currentProfileId = profileId
  }
  if (!sock.connected) {
    sock.connect()
  } else if (profileId) {
    sock.emit('profile:join', profileId)
  }
  return sock
}

export function joinProfile(profileId: string): void {
  const prev = currentProfileId
  const sock = getSocket()
  if (prev && prev !== profileId && sock.connected) {
    sock.emit('profile:leave', prev)
  }
  currentProfileId = profileId
  if (sock.connected) {
    sock.emit('profile:join', profileId)
  } else {
    sock.connect()
  }
}

export function disconnect(): void {
  const sock = socket
  if (!sock) return
  if (currentProfileId && sock.connected) {
    sock.emit('profile:leave', currentProfileId)
  }
  sock.disconnect()
  // currentProfileId se mantiene para permitir re-join explícito en futuros connect()
}

export function leaveProfile(): void {
  const sock = socket
  if (sock && currentProfileId && sock.connected) {
    sock.emit('profile:leave', currentProfileId)
  }
  currentProfileId = null
}

export function getCurrentProfileId(): string | null {
  return currentProfileId
}

export function getRawSocket(): Socket {
  return getSocket()
}

export const socketClient = {
  connect,
  disconnect,
  joinProfile,
  leaveProfile,
  getCurrentProfileId,
  getRawSocket,
}

export type { Socket }
