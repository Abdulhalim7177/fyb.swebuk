"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, Check, CheckCheck, Mic, Square, Trash2 } from "lucide-react";
import { formatDistanceToNow, differenceInHours } from "date-fns";

interface ChatMessage {
  id: string;
  fyp_id: string;
  user_id: string;
  message: string;
  message_type: "text" | "audio" | "file" | "system";
  metadata: any;
  created_at: string;
  read_by?: string[];
  sender_name: string;
  sender_avatar: string | null;
  isTemp?: boolean;
}

interface FYPChatProps {
  fypId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
}

export function FYPChat({
  fypId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: FYPChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const supabase = createClient();

  useEffect(() => {
    initializeChat();
    const channel = setupRealtimeSubscription();
    channelRef.current = channel;

    // Heartbeat to update last_seen
    updateLastSeen(); // Initial update
    const heartbeatInterval = setInterval(updateLastSeen, 60000); // Every minute

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      stopRecordingTimer();
      clearInterval(heartbeatInterval);
    };
  }, [fypId]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages]);

  // Fetch FYP details to identify the other user
  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // 1. Identify other user
      const { data: fyp } = await supabase
        .from("final_year_projects")
        .select("student_id, supervisor_id")
        .eq("id", fypId)
        .single();

      if (fyp) {
        const otherId = fyp.student_id === currentUserId ? fyp.supervisor_id : fyp.student_id;
        setOtherUserId(otherId);
        
        if (otherId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("last_seen")
            .eq("id", otherId)
            .single();
          setOtherUserLastSeen(profile?.last_seen || null);
        }
      }

      // 2. Fetch Messages
      await fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  const updateLastSeen = async () => {
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", currentUserId);
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("fyp_chat")
        .select(`
          *,
          sender:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("fyp_id", fypId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map((msg: any) => ({
        ...msg,
        read_by: msg.read_by || [],
        sender_name: msg.sender?.full_name || "Unknown User",
        sender_avatar: msg.sender?.avatar_url || null,
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`fyp_chat_${fypId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fyp_chat",
          filter: `fyp_id=eq.${fypId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Ignore own messages as they are handled optimistically
            if (payload.new.user_id === currentUserId) return;

            const { data, error } = await supabase
              .from("fyp_chat")
              .select(`
                *,
                sender:user_id (
                  full_name,
                  avatar_url
                )
              `)
              .eq("id", payload.new.id)
              .single();

            if (!error && data) {
              const formattedMessage = {
                ...data,
                read_by: data.read_by || [],
                sender_name: data.sender?.full_name || "Unknown User",
                sender_avatar: data.sender?.avatar_url || null,
              };
              setMessages((prev) => [...prev, formattedMessage]);
              
              if (data.user_id !== currentUserId) {
                markSingleMessageAsRead(data.id, data.read_by || []);
              }
            }
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === payload.new.id 
                  ? { ...msg, ...payload.new, read_by: payload.new.read_by || [] } 
                  : msg
              )
            );
          }
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.user_id !== currentUserId) {
          setOtherUserTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat() as any[];
        const others = users.filter((u) => u.user_id !== currentUserId);
        setOtherUserOnline(others.length > 0);
        
        // If they come online, refresh last seen just in case they leave quickly
        if (others.length > 0 && otherUserId) {
           // We could potentially update state here, but online indicator is enough
        } else if (otherUserId) {
           // If they left, maybe fetch last_seen? 
           // Realistically, presence is faster for "Online" status. 
           // For "Last seen", we rely on the initial fetch + manual re-fetch if needed.
           // Let's re-fetch last_seen when they go offline
           supabase.from("profiles").select("last_seen").eq("id", otherUserId).single()
             .then(({ data }) => {
               if (data) setOtherUserLastSeen(data.last_seen);
             });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return channel;
  };

  const markMessagesAsRead = async () => {
    const unreadMessages = messages.filter(
      (msg) => 
        !msg.isTemp &&
        msg.user_id !== currentUserId && 
        (!msg.read_by || !msg.read_by.includes(currentUserId))
    );

    if (unreadMessages.length === 0) return;

    for (const msg of unreadMessages) {
      const newReadBy = [...(msg.read_by || []), currentUserId];
      await supabase
        .from("fyp_chat")
        .update({ read_by: newReadBy })
        .eq("id", msg.id);
    }
  };

  const markSingleMessageAsRead = async (messageId: string, currentReadBy: string[]) => {
    if (currentReadBy.includes(currentUserId)) return;
    
    const newReadBy = [...currentReadBy, currentUserId];
    await supabase
      .from("fyp_chat")
      .update({ read_by: newReadBy })
      .eq("id", messageId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = () => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId },
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately
    setSending(true);

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      fyp_id: fypId,
      user_id: currentUserId,
      message: messageContent,
      message_type: "text",
      created_at: new Date().toISOString(),
      read_by: [currentUserId],
      sender_name: currentUserName,
      sender_avatar: currentUserAvatar,
      metadata: {},
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase.from("fyp_chat").insert({
        fyp_id: fypId,
        user_id: currentUserId,
        message: messageContent,
        message_type: "text",
        read_by: [currentUserId],
      }).select().single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages((prev) => 
        prev.map(msg => msg.id === tempId ? {
          ...msg, 
          id: data.id, 
          created_at: data.created_at, 
          isTemp: false 
        } : msg)
      );

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      // Remove temp message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // --- Voice Recording Functions ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        sendVoiceNote(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopRecordingTimer();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      stopRecordingTimer();
      setRecordingDuration(0);
      audioChunksRef.current = [];
    }
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const sendVoiceNote = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) {
      console.warn("Audio blob is empty, skipping upload");
      toast.error("Recording failed: Audio empty");
      return;
    }

    setSending(true);
    const duration = recordingDuration;
    setRecordingDuration(0); // Reset for UI immediately

    // Optimistic UI for Audio
    const tempId = `temp-audio-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      fyp_id: fypId,
      user_id: currentUserId,
      message: URL.createObjectURL(audioBlob), // Use blob URL for preview
      message_type: "audio",
      created_at: new Date().toISOString(),
      read_by: [currentUserId],
      sender_name: currentUserName,
      sender_avatar: currentUserAvatar,
      metadata: { duration },
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const timestamp = Date.now();
      const fileName = `${fypId}/${currentUserId}/${timestamp}.webm`;

      console.log("Uploading voice note:", fileName, "Size:", audioBlob.size);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("chat-voice-notes")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
        });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("chat-voice-notes")
        .getPublicUrl(fileName);

      const { data: msgData, error: msgError } = await supabase.from("fyp_chat").insert({
        fyp_id: fypId,
        user_id: currentUserId,
        message: publicUrl,
        message_type: "audio",
        read_by: [currentUserId],
        metadata: { duration }
      }).select().single();

      if (msgError) {
        console.error("Supabase DB Insert Error:", msgError);
        throw msgError;
      }

      // Update temp message with real data
      setMessages((prev) => 
        prev.map(msg => msg.id === tempId ? {
          ...msg, 
          id: msgData.id, 
          message: msgData.message, // Use real URL now
          created_at: msgData.created_at, 
          isTemp: false 
        } : msg)
      );

    } catch (error: any) {
      console.error("Error sending voice note full object:", JSON.stringify(error, null, 2));
      console.error("Error sending voice note:", error);
      toast.error("Failed to send voice note");
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  const isMessageRead = (msg: ChatMessage) => {
    if (!msg.read_by) return false;
    return msg.read_by.some(id => id !== currentUserId);
  };

  const isVoiceNoteExpired = (dateString: string) => {
    const date = new Date(dateString);
    const hours = differenceInHours(new Date(), date);
    return hours >= 24;
  };

  if (loading) {
    return (
      <Card className="h-[500px]">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="border-b py-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Project Chat
          </CardTitle>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${otherUserOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-xs text-muted-foreground">
                {otherUserOnline ? "Online" : "Offline"}
              </span>
            </div>
            {!otherUserOnline && otherUserLastSeen && (
              <span className="text-[10px] text-muted-foreground">
                Last seen {formatDistanceToNow(new Date(otherUserLastSeen), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
                <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Discuss your project with your supervisor here
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.user_id === currentUserId;
                const isRead = isMessageRead(message);
                const isAudio = message.message_type === 'audio';
                const isExpired = isAudio && isVoiceNoteExpired(message.created_at);
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                      <AvatarImage src={message.sender_avatar || undefined} />
                      <AvatarFallback className="text-xs bg-muted">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col ${
                        isCurrentUser ? "items-end" : "items-start"
                      } max-w-[80%]`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        } ${message.isTemp ? "opacity-70" : ""}`}
                      >
                        {!isCurrentUser && (
                          <p className="text-[10px] font-semibold mb-1 opacity-70">
                            {message.sender_name}
                          </p>
                        )}
                        
                        {isAudio ? (
                          isExpired ? (
                            <div className="flex items-center gap-2 italic opacity-70">
                              <Trash2 className="h-4 w-4" />
                              <span>Voice note expired</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                              <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                                <span>Voice Note</span>
                                <span>{message.metadata?.duration ? formatDuration(message.metadata.duration) : ""}</span>
                              </div>
                              <audio 
                                src={message.message} 
                                controls 
                                className="h-8 w-full max-w-[250px]" 
                                style={{ borderRadius: '20px' }}
                              />
                              <p className="text-[10px] mt-1 opacity-70 text-center">
                                Auto-deletes in 24h
                              </p>
                            </div>
                          )
                        ) : (
                          <p className="whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isCurrentUser && (
                          <span title={isRead ? "Read" : "Delivered"}>
                            {message.isTemp ? (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            ) : isRead ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {otherUserTyping && (
          <div className="absolute bottom-2 left-4 text-xs text-muted-foreground italic bg-background/80 px-2 py-1 rounded animate-pulse">
            Typing...
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t p-3 bg-muted/30">
        {isRecording ? (
          <div className="flex items-center gap-3 w-full bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-100 dark:border-red-900/30">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="flex-1 font-mono text-sm text-red-600 dark:text-red-400">
              {formatDuration(recordingDuration)}
            </span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={cancelRecording}
              className="text-muted-foreground hover:text-red-500"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Square className="h-3 w-3 mr-2" fill="currentColor" />
              Stop & Send
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={startRecording}
              disabled={sending}
              title="Record Voice Note"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 bg-background"
            />
            <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}
      </CardFooter>
    </Card>
  );
}
