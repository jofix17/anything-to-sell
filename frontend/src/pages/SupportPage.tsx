import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import chatService from "../services/chatService";
import { Conversation, Message } from "../types";

const MessageSchema = Yup.object().shape({
  content: Yup.string().required("Message cannot be empty"),
});

const NewTicketSchema = Yup.object().shape({
  subject: Yup.string().required("Subject is required"),
  message: Yup.string().required("Message is required"),
});

const SupportPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Connect to socket
        chatService.connectSocket();

        // Fetch all support conversations for the user
        const supportConversations =
          await chatService.getSupportConversations();
        const { data } = supportConversations;
        setConversations(data);

        // Select the most recent conversation if any
        if (data.length > 0) {
          const mostRecent = data.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          setSelectedConversation(mostRecent);
        } else {
          setShowNewTicket(true);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load support conversations"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();

    // Cleanup
    return () => {
      chatService.disconnectSocket();
    };
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      try {
        setMessages([]);

        // Join the conversation room
        chatService.joinConversation(selectedConversation.id);

        // Fetch messages for the selected conversation
        const messagesResponse = await chatService.getMessages(
          selectedConversation.id
        );
        setMessages(messagesResponse.data);

        // Mark messages as read
        await chatService.markAsRead(selectedConversation.id);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };

    fetchMessages();

    // Setup message listener
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    if (selectedConversation) {
      chatService.addMessageListener(selectedConversation.id, handleNewMessage);
    }

    // Cleanup
    return () => {
      if (selectedConversation) {
        chatService.leaveConversation(selectedConversation.id);
        chatService.removeMessageListener(
          selectedConversation.id,
          handleNewMessage
        );
      }
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowNewTicket(false);
  };

  const handleSendMessage = async (
    values: { content: string },
    { resetForm }: { resetForm: () => void }
  ) => {
    if (!selectedConversation) return;

    try {
      setIsSending(true);

      await chatService.sendMessage(selectedConversation.id, values.content);
      resetForm();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async (
    values: { subject: string; message: string },
    { resetForm }: { resetForm: () => void }
  ) => {
    try {
      setIsSending(true);

      const newConversation = await chatService.createSupportConversation(
        values.subject,
        values.message
      );
      const { data } = newConversation;
      setConversations([data, ...conversations]);
      setSelectedConversation(data);
      setShowNewTicket(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create support ticket"
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedConversation) return;

    try {
      await chatService.closeSupportConversation(selectedConversation.id);

      // Update the status in the UI
      setSelectedConversation({
        ...selectedConversation,
        status: "closed",
      });

      // Update the conversation in the list
      setConversations(
        conversations.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, status: "closed" }
            : conv
        )
      );
    } catch (err) {
      console.error("Failed to close ticket:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise, show the full date
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Customer Support
        </h1>
        <button
          onClick={() => setShowNewTicket(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Ticket
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Conversation List */}
          <div className="border-r border-gray-200 md:col-span-1">
            <div className="py-4 px-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Your Tickets
              </h2>
            </div>
            <div className="overflow-y-auto h-[500px]">
              {conversations.length === 0 ? (
                <div className="py-4 px-4 text-center text-gray-500">
                  No support tickets yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {conversations.map((conversation) => (
                    <li
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedConversation?.id === conversation.id
                          ? "bg-gray-50"
                          : ""
                      }`}
                    >
                      <div className="px-4 py-4">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.subject}
                          </p>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              conversation.status === "open"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {conversation.status === "open" ? "Open" : "Closed"}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage
                              ? conversation.lastMessage.content
                                ? conversation.lastMessage.content.substring(
                                    0,
                                    50
                                  ) +
                                  (conversation.lastMessage.content.length > 50
                                    ? "..."
                                    : "")
                                : "No message content"
                              : "No messages yet"}
                          </p>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {formatDate(conversation.updatedAt)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Message Display and Form */}
          <div className="md:col-span-2 flex flex-col h-[600px]">
            {showNewTicket ? (
              <div className="flex-1 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Create New Support Ticket
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Please provide details about your issue and our support team
                    will get back to you as soon as possible.
                  </p>
                </div>

                <Formik
                  initialValues={{ subject: "", message: "" }}
                  validationSchema={NewTicketSchema}
                  onSubmit={handleCreateTicket}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-6">
                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Subject
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="subject"
                            id="subject"
                            placeholder="e.g., Order issue, Product question, etc."
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage
                            name="subject"
                            component="div"
                            className="mt-1 text-sm text-red-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Message
                        </label>
                        <div className="mt-1">
                          <Field
                            as="textarea"
                            name="message"
                            id="message"
                            rows={6}
                            placeholder="Please describe your issue in detail..."
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage
                            name="message"
                            component="div"
                            className="mt-1 text-sm text-red-600"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            if (conversations.length > 0) {
                              setShowNewTicket(false);
                              setSelectedConversation(conversations[0]);
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || isSending}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                          {isSending ? "Creating..." : "Create Ticket"}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            ) : selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      #{selectedConversation.id}: {selectedConversation.subject}
                    </h2>
                    <span
                      className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedConversation.status === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedConversation.status === "open"
                        ? "Open"
                        : "Closed"}
                    </span>
                  </div>
                  {selectedConversation.status === "open" && (
                    <button
                      onClick={handleCloseTicket}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>

                {/* Messages Display */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No messages yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedConversation.status === "open"
                          ? "Start the conversation by sending a message."
                          : "This ticket has been closed."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === selectedConversation.userId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-md rounded-lg px-4 py-2 ${
                              message.senderId === selectedConversation.userId
                                ? "bg-indigo-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <div className="text-sm">{message.content}</div>
                            <div className="mt-1 text-xs text-gray-500 text-right">
                              {formatDate(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input Form */}
                {selectedConversation.status === "open" && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <Formik
                      initialValues={{ content: "" }}
                      validationSchema={MessageSchema}
                      onSubmit={handleSendMessage}
                    >
                      {({ isSubmitting }) => (
                        <Form className="flex">
                          <div className="flex-1">
                            <Field
                              type="text"
                              name="content"
                              placeholder="Type your message..."
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                            <ErrorMessage
                              name="content"
                              component="div"
                              className="mt-1 text-sm text-red-600"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmitting || isSending}
                            className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                          >
                            {isSending ? (
                              <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : (
                              "Send"
                            )}
                          </button>
                        </Form>
                      )}
                    </Formik>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No conversation selected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a conversation or create a new ticket.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
