/**
 * WebSocket utility for real-time features
 * Supports reconnection, message queuing, and event handling
 */

type MessageHandler = (data: any) => void
type ConnectionHandler = () => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: string[] = []
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private onConnectHandlers: ConnectionHandler[] = []
  private onDisconnectHandlers: ConnectionHandler[] = []
  private isConnecting = false

  constructor(url: string) {
    this.url = url
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true
    const token = localStorage.getItem('access_token')
    const wsUrl = `${this.url}?token=${token || ''}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.onConnectHandlers.forEach(handler => handler())
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift()
          if (message && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message)
          }
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const handlers = this.messageHandlers.get(data.type) || []
          handlers.forEach(handler => handler(data.payload || data))
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnecting = false
      }

      this.ws.onclose = () => {
        this.isConnecting = false
        this.onDisconnectHandlers.forEach(handler => handler())
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      this.isConnecting = false
      this.attemptReconnect()
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  send(type: string, payload: any): void {
    const message = JSON.stringify({ type, payload })
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    } else {
      this.messageQueue.push(message)
      if (this.ws?.readyState !== WebSocket.CONNECTING) {
        this.connect()
      }
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.onConnectHandlers.push(handler)
    return () => {
      const index = this.onConnectHandlers.indexOf(handler)
      if (index > -1) {
        this.onConnectHandlers.splice(index, 1)
      }
    }
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.onDisconnectHandlers.push(handler)
    return () => {
      const index = this.onDisconnectHandlers.indexOf(handler)
      if (index > -1) {
        this.onDisconnectHandlers.splice(index, 1)
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.messageQueue = []
    this.reconnectAttempts = 0
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instances for different WebSocket connections
const mentorshipWS = new WebSocketClient(
  `${process.env.NEXT_PUBLIC_DJANGO_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/ws/mentorships/chat`
)

const coachingWS = new WebSocketClient(
  `${process.env.NEXT_PUBLIC_DJANGO_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/ws/aicoach`
)

export { mentorshipWS, coachingWS }

