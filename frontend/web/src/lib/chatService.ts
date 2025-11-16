// Chat API service - Now using .NET API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5266";

export interface ChatMessage {
  message: string;
  userId?: number;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  model?: string;
  error?: string;
  timestamp?: string;
}

export class ChatService {
  static async sendMessage(userId: number, message: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/test`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error testing connection:", error);
      throw error;
    }
  }
}
