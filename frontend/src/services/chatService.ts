import apiService from './api';
import { Message, Conversation, ApiResponse, PaginatedResponse } from '../types';
import { io, Socket } from 'socket.io-client';

class ChatService {
  private socket: Socket | null = null;
  private messageListeners: Map<string, ((message: Message) => void)[]> = new Map();
  
  // Initialize socket connection
  connectSocket(): void {
    if (!this.socket) {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      this.socket = io(`${API_URL}/chat`, {
        auth: {
          token
        }
      });
      
      this.setupSocketListeners();
    }
  }
  
  // Disconnect socket
  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.messageListeners.clear();
    }
  }
  
  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });
    
    this.socket.on('message', (message: Message) => {
      // Notify all listeners for this conversation
      const conversationId = message.id.toString();
      const listeners = this.messageListeners.get(conversationId) || [];
      listeners.forEach(listener => listener(message));
    });
    
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }
  
  // Add a message listener for a specific conversation
  addMessageListener(conversationId: string, listener: (message: Message) => void): void {
    if (!this.messageListeners.has(conversationId)) {
      this.messageListeners.set(conversationId, []);
    }
    this.messageListeners.get(conversationId)?.push(listener);
  }
  
  // Remove a message listener
  removeMessageListener(conversationId: string, listener: (message: Message) => void): void {
    const listeners = this.messageListeners.get(conversationId) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  // Join a conversation room
  joinConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('join', { conversationId });
    }
  }
  
  // Leave a conversation room
  leaveConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('leave', { conversationId });
    }
  }
  
  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    const response = await apiService.get<ApiResponse<Conversation[]>>('/conversations');
    return response.data;
  }
  
  // Get or create a conversation with another user
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    const response = await apiService.post<ApiResponse<Conversation>>('/conversations', { userId });
    return response.data;
  }
  
  // Get messages for a conversation
  async getMessages(conversationId: string, page = 1, perPage = 20): Promise<PaginatedResponse<Message>> {
    return await apiService.get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages`, {
      page,
      perPage
    });
  }
  
  // Send a message
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await apiService.post<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, {
      content
    });
    return response.data;
  }
  
  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    await apiService.patch<ApiResponse<null>>(`/conversations/${conversationId}/read`);
  }
  
  // Support chat for vendors and admin
  async getSupportConversations(status?: 'open' | 'closed'): Promise<Conversation[]> {
    const response = await apiService.get<ApiResponse<Conversation[]>>('/support/conversations', { status });
    return response.data;
  }
  
  // Create a support conversation (for buyers)
  async createSupportConversation(subject: string, message: string): Promise<Conversation> {
    const response = await apiService.post<ApiResponse<Conversation>>('/support/conversations', {
      subject,
      message
    });
    return response.data;
  }
  
  // Close a support conversation
  async closeSupportConversation(conversationId: string): Promise<void> {
    await apiService.patch<ApiResponse<null>>(`/support/conversations/${conversationId}/close`);
  }
}

const chatService = new ChatService();
export default chatService;
