import { User } from "./auth";

export interface Message {
  id: string;
  senderId: string; // matches Rails sender_id
  sender?: User;
  receiverId: string; // matches Rails receiver_id
  receiver?: User;
  content: string;
  isRead: boolean; // matches Rails is_read
  createdAt: string; // matches Rails created_at
}

export interface Conversation {
  id: string;
  userId: string; // matches Rails user_id
  participants: User[];
  lastMessage?: Message;
  unreadCount: number; // matches Rails unread_count
  updatedAt: string; // matches Rails updated_at
  subject: string;
  status: "open" | "closed" | "archived";
}
