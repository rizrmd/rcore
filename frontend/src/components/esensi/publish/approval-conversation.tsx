import React, { useEffect, useState } from "react";
import { ApprovalChat } from "@/components/ui/approval-chat";
import { current as layoutCurrent } from "@/components/ext/layout/publish.esensi";
import { api as internalApi } from "@/lib/gen/internal.esensi";
import { api } from "@/lib/gen/publish.esensi";
import { BookStatus } from "shared/types";

interface ApprovalConversationProps {
  bookId: string;
}

/**
 * Approval Conversation Component
 * Handles the approval chat interface for book submissions
 */
export const ApprovalConversation: React.FC<ApprovalConversationProps> = ({ 
  bookId 
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = layoutCurrent.user;
  const isEsensiUser = !currentUser?.idAuthor;

  // Load book approval messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await api.books({
          action: "nested_list",
          nested_model: "book_approval",
          parent_id: bookId,
        });
        
        if (response.data) {
          // Convert book approval records to chat messages
          const chatMessages = response.data.map(
            (approval: any, index: number) => ({
              id: approval.id || `msg-${index}`,
              sender: approval.id_internal ? "esensi" : "author",
              senderName: approval.id_internal
                ? approval.internal?.name || "Esensi Online"
                : approval.book?.author?.name || "Penulis",
              senderAvatar: approval.id_internal
                ? approval.internal?.image
                : approval.book?.author?.image,
              message: approval.comment || "Tidak ada komentar",
              timestamp: new Date(approval.created_at),
              status: approval.status,
              type:
                index === 0
                  ? "message"
                  : response.data[index - 1]?.status !== approval.status
                  ? "status_change"
                  : "message",
            })
          );
          setMessages(chatMessages);
        }
      } catch (error) {
        console.error("Failed to load approval messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      loadMessages();
    }
  }, [bookId]);

  const handleSendMessage = async (message: string) => {
    // For authors, just add a comment without status change
    const response = await internalApi.book_approval_create({
      id_book: bookId,
      comment: message,
      status: undefined, // No status change for regular messages
    });

    if (response.success) {
      // Reload messages
      const updatedResponse = await api.books({
        action: "nested_list",
        nested_model: "book_approval",
        parent_id: bookId,
      });
      
      if (updatedResponse.data) {
        const chatMessages = updatedResponse.data.map(
          (approval: any, index: number) => ({
            id: approval.id || `msg-${index}`,
            sender: approval.id_internal ? "esensi" : "author",
            senderName: approval.id_internal
              ? approval.internal?.name || "Esensi Online"
              : approval.book?.author?.name || "Penulis",
            senderAvatar: approval.id_internal
              ? approval.internal?.image
              : approval.book?.author?.image,
            message: approval.comment || "Tidak ada komentar",
            timestamp: new Date(approval.created_at),
            status: approval.status,
            type:
              index === 0
                ? "message"
                : updatedResponse.data[index - 1]?.status !== approval.status
                ? "status_change"
                : "message",
          })
        );
        setMessages(chatMessages);
      }
    }
  };

  const handleStatusChange = async (status: string, comment: string) => {
    const response = await internalApi.book_approval_create({
      id_book: bookId,
      comment,
      status: status as BookStatus,
      id_internal: currentUser?.idInternal || undefined,
    });

    if (response.success) {
      // Reload messages
      const updatedResponse = await api.books({
        action: "nested_list",
        nested_model: "book_approval",
        parent_id: bookId,
      });
      
      if (updatedResponse.data) {
        const chatMessages = updatedResponse.data.map(
          (approval: any, index: number) => ({
            id: approval.id || `msg-${index}`,
            sender: approval.id_internal ? "esensi" : "author",
            senderName: approval.id_internal
              ? approval.internal?.name || "Esensi Online"
              : approval.book?.author?.name || "Penulis",
            senderAvatar: approval.id_internal
              ? approval.internal?.image
              : approval.book?.author?.image,
            message: approval.comment || "Tidak ada komentar",
            timestamp: new Date(approval.created_at),
            status: approval.status,
            type:
              index === 0
                ? "message"
                : updatedResponse.data[index - 1]?.status !== approval.status
                ? "status_change"
                : "message",
          })
        );
        setMessages(chatMessages);
      }

      // Refresh parent page to update book status
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Memuat percakapan...</div>
      </div>
    );
  }

  return (
    <ApprovalChat
      bookId={bookId}
      messages={messages}
      onSendMessage={handleSendMessage}
      onStatusChange={handleStatusChange}
      currentUserType={isEsensiUser ? "esensi" : "author"}
      currentUserName={
        currentUser?.name || (isEsensiUser ? "Esensi Online" : "Penulis")
      }
      currentUserAvatar={currentUser?.image || undefined}
      loading={loading}
    />
  );
};