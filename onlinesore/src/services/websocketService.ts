type MessageType = 'cursor' | 'edit' | 'selection';

interface CollaboratorCursor {
  userId: string;
  position: { lineNumber: number; column: number };
}

interface CollaboratorSelection {
  userId: string;
  selection: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
}

interface CollaboratorEdit {
  userId: string;
  changes: { range: any; text: string }[];
}

interface WebSocketMessage {
  type: MessageType;
  payload: CollaboratorCursor | CollaboratorSelection | CollaboratorEdit;
  userId: string;
}

export class WebSocketService {
  private static instance: WebSocket | null = null;
  private static listeners: Map<string, Set<(message: any) => void>> = new Map();
  private static userId: string = Math.random().toString(36).substr(2, 9);

  static connect(fileId: string) {
    if (this.instance) {
      this.instance.close();
    }

    this.instance = new WebSocket(`ws://localhost:3001/collaboration/${fileId}`);
    
    this.instance.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      const listeners = this.listeners.get(message.type);
      if (listeners) {
        listeners.forEach(listener => listener(message.payload));
      }
    };

    this.instance.onclose = () => {
      setTimeout(() => this.connect(fileId), 1000); // Reconnect after 1 second
    };
  }

  static subscribe(type: MessageType, callback: (message: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  static unsubscribe(type: MessageType, callback: (message: any) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  static sendMessage(type: MessageType, payload: any) {
    if (this.instance?.readyState === WebSocket.OPEN) {
      this.instance.send(JSON.stringify({
        type,
        payload,
        userId: this.userId
      }));
    }
  }
} 