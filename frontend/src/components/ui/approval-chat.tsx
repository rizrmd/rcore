import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateObject } from "@/lib/utils";
import { Send, Clock, CheckCircle, XCircle, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { BookStatus } from "shared/types";

export interface ChatMessage {
  id: string;
  sender: "author" | "esensi";
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
  status?: BookStatus;
  type: "message" | "status_change";
}

export interface ApprovalChatProps {
  bookId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onStatusChange: (status: BookStatus, comment: string) => Promise<void>;
  currentUserType: "author" | "esensi";
  currentUserName: string;
  currentUserAvatar?: string;
  loading?: boolean;
  disabled?: boolean;
  bookStatus?: BookStatus;
}

const getStatusIcon = (status: BookStatus) => {
  switch (status) {
    case BookStatus.PUBLISHED:
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case BookStatus.REJECTED:
      return <XCircle className="w-4 h-4 text-red-600" />;
    case BookStatus.DRAFT:
      return <Edit className="w-4 h-4 text-yellow-600" />;
    case BookStatus.SUBMITTED:
      return <Clock className="w-4 h-4 text-blue-600" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: BookStatus) => {
  switch (status) {
    case BookStatus.PUBLISHED:
      return "Disetujui untuk Terbit";
    case BookStatus.REJECTED:
      return "Ditolak";
    case BookStatus.DRAFT:
      return "Perlu Revisi";
    case BookStatus.SUBMITTED:
      return "Diajukan untuk Review";
    default:
      return status;
  }
};

const getStatusColor = (status: BookStatus) => {
  switch (status) {
    case BookStatus.PUBLISHED:
      return "bg-green-100 border-green-200";
    case BookStatus.REJECTED:
      return "bg-red-100 border-red-200";
    case BookStatus.DRAFT:
      return "bg-yellow-100 border-yellow-200";
    case BookStatus.SUBMITTED:
      return "bg-blue-100 border-blue-200";
    default:
      return "bg-gray-100 border-gray-200";
  }
};

export const ApprovalChat = ({
  bookId,
  messages,
  onSendMessage,
  onStatusChange,
  currentUserType,
  currentUserName,
  currentUserAvatar,
  loading = false,
  disabled = false,
  bookStatus,
}: ApprovalChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status: BookStatus) => {
    if (!newMessage.trim() && status !== BookStatus.PUBLISHED) {
      alert("Silakan masukkan komentar terlebih dahulu untuk perubahan status ini.");
      return;
    }

    setIsSending(true);
    try {
      await onStatusChange(status, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to change status:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canChangeStatus = currentUserType === "esensi" && bookStatus !== BookStatus.PUBLISHED && bookStatus !== BookStatus.REJECTED;

  return (
    <div className="flex flex-col h-full flex-1 ">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-xl">
        <h3 className="font-semibold text-gray-900">Diskusi Persetujuan Buku</h3>
        <p className="text-sm text-gray-600">Komunikasi antara penulis dan tim editorial</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Belum ada percakapan. Mulai diskusi dengan mengirim pesan.</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "status_change" ? (
                  /* Status Change Message */
                  <div className="flex justify-center my-4">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(msg.status!)}`}>
                      {getStatusIcon(msg.status!)}
                      <span className="text-sm font-medium">
                        {msg.senderName} mengubah status menjadi: {getStatusLabel(msg.status!)}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Regular Message */
                  <div className={`flex ${msg.sender === currentUserType ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[70%] ${msg.sender === currentUserType ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                        <AvatarFallback className="text-xs">
                          {msg.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <Card className={`${
                        msg.sender === currentUserType 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <CardHeader className="pb-2 px-3 pt-3">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {msg.senderName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateObject(msg.timestamp)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 pt-0">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Message Input Area */}
      {!disabled && (
        <div className="border-t p-4 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={currentUserAvatar} alt={currentUserName} />
              <AvatarFallback className="text-xs">
                {currentUserName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tulis pesan..."
                className="min-h-[60px] mb-3 resize-none"
                disabled={isSending || loading}
              />
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending || loading}
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {isSending ? "Mengirim..." : "Kirim"}
                  </Button>
                </div>

                {/* Status Change Buttons (Esensi Only) */}
                {canChangeStatus && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(BookStatus.PUBLISHED)}
                      disabled={isSending || loading}
                      className="text-green-700 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Setujui
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(BookStatus.DRAFT)}
                      disabled={isSending || loading || !newMessage.trim()}
                      className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Minta Revisi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(BookStatus.REJECTED)}
                      disabled={isSending || loading || !newMessage.trim()}
                      className="text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};