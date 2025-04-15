import apiService from './api';
import { Message, Conversation, ApiResponse, PaginatedResponse } from '../types';
import { io, Socket } from 'socket.io-client';
import queryHooks from '../hooks/useQueryHooks';
import { QueryKeys } from '../utils/queryKeys';
import { useEffect } from 'react';

const { useApiQuery, useApiMutation, usePaginatedQuery, useInvalidateQueries } = queryHooks;

// Traditional API service methods
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
    
    this.socket.on('error', (error: Error) => {
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
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return await apiService.get<ApiResponse<Conversation[]>>('/api/v1/conversations');
  }
  
  // Get or create a conversation with another user
  async getOrCreateConversation(userId: number): Promise<ApiResponse<Conversation>> {
    return await apiService.post<ApiResponse<Conversation>>('/api/v1/conversations', { userId });
  }
  
  // Get messages for a conversation
  async getMessages(conversationId: string, page = 1, perPage = 20): Promise<ApiResponse<PaginatedResponse<Message>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<Message>>>(`/api/v1/conversations/${conversationId}/messages`, {
      page,
      perPage
    });
  }
  
  // Send a message
  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    return await apiService.post<ApiResponse<Message>>(`/api/v1/conversations/${conversationId}/messages`, {
      content
    });
  }
  
  // Mark messages as read
  async markAsRead(conversationId: string): Promise<ApiResponse<null>> {
    return await apiService.patch<ApiResponse<null>>(`/api/v1/conversations/${conversationId}/read`);
  }
  
  // Support chat for vendors and admin
  async getSupportConversations(status?: 'open' | 'closed'): Promise<ApiResponse<Conversation[]>> {
    return await apiService.get<ApiResponse<Conversation[]>>('/api/v1/support/conversations', { status });
  }
  
  // Create a support conversation (for buyers)
  async createSupportConversation(subject: string, message: string): Promise<ApiResponse<Conversation>> {
    return await apiService.post<ApiResponse<Conversation>>('/api/v1/support/conversations', {
      subject,
      message
    });
  }
  
  // Close a support conversation
  async closeSupportConversation(conversationId: string): Promise<ApiResponse<null>> {
    return await apiService.patch<ApiResponse<null>>(`/api/v1/support/conversations/${conversationId}/close`);
  }
}

// Create the standard service instance
const chatService = new ChatService();

// React Query hooks

// Custom hook for managing socket connection
export const useChatSocket = () => {
  useEffect(() => {
    chatService.connectSocket();
    
    return () => {
      chatService.disconnectSocket();
    };
  }, []);
  
  return {
    joinConversation: chatService.joinConversation.bind(chatService),
    leaveConversation: chatService.leaveConversation.bind(chatService),
    addMessageListener: chatService.addMessageListener.bind(chatService),
    removeMessageListener: chatService.removeMessageListener.bind(chatService),
  };
};

// Hook for getting all conversations
export const useConversations = (options = {}) => {
  return useApiQuery(
    ['conversations'],
    () => chatService.getConversations(),
    options
  );
};

// Hook for getting or creating a conversation
export const useGetOrCreateConversation = (options = {}) => {
  return useApiMutation(
    (userId: number) => chatService.getOrCreateConversation(userId),
    options
  );
};

// Hook for getting messages in a conversation
export const useConversationMessages = (
  conversationId: string, 
  page = 1, 
  perPage = 20, 
  options = {}
) => {
  return usePaginatedQuery(
    QueryKeys.support.messages(conversationId),
    () => chatService.getMessages(conversationId, page, perPage),
    {
      ...options,
      enabled: !!conversationId, // Only run query if conversationId is provided
    }
  );
};

// Hook for sending a message
export const useSendMessage = (options = {}) => {
  return useApiMutation(
    ({ conversationId, content }: { conversationId: string; content: string }) => 
      chatService.sendMessage(conversationId, content),
    options
  );
};

// Hook for marking messages as read
export const useMarkMessagesAsRead = (options = {}) => {
  return useApiMutation(
    (conversationId: string) => chatService.markAsRead(conversationId),
    options
  );
};

// Hook for support conversations
export const useSupportConversations = (status?: 'open' | 'closed', options = {}) => {
  return useApiQuery(
    QueryKeys.support.conversations(status),
    () => chatService.getSupportConversations(status),
    options
  );
};

// Hook for creating a support conversation
export const useCreateSupportConversation = (options = {}) => {
  return useApiMutation(
    ({ subject, message }: { subject: string; message: string }) => 
      chatService.createSupportConversation(subject, message),
    options
  );
};

// Hook for closing a support conversation
export const useCloseSupportConversation = (options = {}) => {
  return useApiMutation(
    (conversationId: string) => chatService.closeSupportConversation(conversationId),
    options
  );
};

// Custom hook to automatically join a conversation and handle listeners
export const useConversation = (conversationId: string) => {
  const { joinConversation, leaveConversation } = useChatSocket();
  const invalidateQueries = useInvalidateQueries();
  
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
      
      return () => {
        leaveConversation(conversationId);
      };
    }
  }, [conversationId, joinConversation, leaveConversation]);
  
  const messagesQuery = useConversationMessages(conversationId);
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      // Automatically refetch messages when we send a new one
      invalidateQueries(QueryKeys.support.messages(conversationId));
    },
  });
  const markAsReadMutation = useMarkMessagesAsRead();
  
  return {
    messages: messagesQuery.data,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage: (content: string) => sendMessageMutation.mutate({ conversationId, content }),
    isSending: sendMessageMutation.isPending,
    markAsRead: () => markAsReadMutation.mutate(conversationId),
  };
};

// Export the original service for cases where direct API calls are needed
export default chatService;