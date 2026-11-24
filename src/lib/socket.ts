import { io, type Socket } from 'socket.io-client'

// En desarrollo no hay VITE_API_URL: se usa el mismo origen y el proxy de
// Vite (/socket.io -> :3001). En Docker/CI la API se expone en otra URL;
// derivamos el origen del socket de VITE_API_URL para no necesitar otra
// variable, con VITE_SOCKET_URL como override explícito.
const API_BASE_FALLBACK = import.meta.env.VITE_API_URL || '/api'

function derivedSocketUrl(apiBaseUrl: string): string | undefined {
  return apiBaseUrl.startsWith('http') ? new URL(apiBaseUrl).origin : undefined
}

export const SOCKET_URL_FALLBACK =
  import.meta.env.VITE_SOCKET_URL || derivedSocketUrl(API_BASE_FALLBACK)

let socketUrl: string | undefined = SOCKET_URL_FALLBACK
let socket: Socket | null = null
let currentProfileId: string | null = null
let listenersBound = false

// Debe llamarse antes de crear el socket (lo hace el bootstrap). Si el socket
// ya existiera, se descarta para no conservar el origen horneado.
export function configureSocketUrl(url?: string): void {
  const next = url || SOCKET_URL_FALLBACK
  if (next === socketUrl) return
  socketUrl = next
  if (socket) {
    socket.disconnect()
    socket = null
    listenersBound = false
  }
}

export function getSocketUrl(): string | undefined {
  return socketUrl
}

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
    socket = io(socketUrl, {
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
