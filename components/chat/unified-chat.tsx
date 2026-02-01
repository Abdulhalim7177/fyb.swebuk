"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, Check, CheckCheck, Mic, Square, Trash2, Phone, PhoneIncoming, Users, History } from "lucide-react";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { CallInterface } from "./call-interface";
import { CallNotification } from "./call-notification";
import { CallHistory } from "./call-history";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ChatMessage {
  id: string;
  [key: string]: any; 
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

interface UnifiedChatProps {
  id: string; // contextId
  table: string; 
  idColumn: string; 
  bucket?: string; 
  title?: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
}

export function UnifiedChat({
  id,
  table,
  idColumn,
  bucket = "chat-voice-notes",
  title = "Chat",
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: UnifiedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  
  // Realtime Status
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [recordingUsers, setRecordingUsers] = useState<Set<string>>(new Set());
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  // Call State
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallParticipants, setActiveCallParticipants] = useState<any[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ id: string, initiator: { name: string, avatar: string | null } } | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const recordingTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const channelRef = useRef<any>(null);

  const supabase = createClient();

  // Determine context type for call_logs
  const contextType = table.includes("cluster") ? "cluster" : table.includes("fyp") ? "fyp" : "project";

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  useEffect(() => {
    fetchMessages();
    const channel = setupRealtimeSubscription();
    channelRef.current = channel;
    
    // Check for existing active calls
    checkActiveCalls();

    return () => {
      if (channelRef.current) {
        if (isInCall) {
          handleLeaveCall();
        }
        supabase.removeChannel(channelRef.current);
      }
      stopRecordingTimer();
    };
  }, [id, table]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(table)
        .select(`
          *,
          sender:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq(idColumn, id)
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
    } finally {
      setLoading(false);
    }
  };

  const checkActiveCalls = async () => {
    console.log("Checking active calls for context:", id, contextType);

    type CallLogWithInitiator = {
      id: string;
      status: string;
      initiator: {
        full_name: any;
        avatar_url: any;
      } | null;
    };

    const { data, error } = await supabase
      .from("call_logs")
      .select(`
        id,
        status,
        initiator:initiator_id(full_name, avatar_url)
      `)
      .eq("context_id", id)
      .eq("context_type", contextType)
      .in("status", ["waiting", "active"])
      .order("started_at", { ascending: false })
      .limit(1)
      .single<CallLogWithInitiator>();

    if (error && error.code !== 'PGRST116') {
      console.error("Error checking active calls:", error);
    }

    if (data) {
      console.log("Found active call:", data);

      // Check if we are already a participant (Persistence)
      const { data: participation } = await supabase
        .from("call_participants")
        .select("id")
        .eq("call_id", data.id)
        .eq("user_id", currentUserId)
        .is("left_at", null)
        .maybeSingle();

      if (participation) {
         console.log("User is already a participant. Auto-rejoining...");
         handleJoinCall(data.id);
      } else {
        // If there is an active call and we are not in it, show incoming
        if (data.initiator && !isInCall) {
           setIncomingCall({
             id: data.id,
             initiator: {
               name: data.initiator.full_name,
               avatar: data.initiator.avatar_url
             }
           });
        }
      }
    } else {
      console.log("No active calls found.");
    }
  };

  const setupRealtimeSubscription = () => {
    const channelName = `${table}_${id}`;
    console.log("Setting up realtime subscription for:", channelName);
    const channel = supabase
      .channel(channelName)
      // Chat Messages
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: `${idColumn}=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            if (payload.new.user_id === currentUserId) return;
            // Fetch and format...
            const { data } = await supabase.from(table).select("*, sender:user_id(full_name, avatar_url)").eq("id", payload.new.id).single();
            if(data) {
                const formatted = { ...data, read_by: data.read_by || [], sender_name: data.sender?.full_name, sender_avatar: data.sender?.avatar_url };
                setMessages(prev => [...prev, formatted]);
                
                // Mark as read immediately if it's a new message for us
                markSingleMessageAsRead(data.id, data.read_by || []);
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
      // Call Logs (Ringing)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_logs",
          filter: `context_id=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // New call started
            if (payload.new.status === "waiting" && payload.new.initiator_id !== currentUserId) {
               // Fetch initiator details
               const { data: initiator } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", payload.new.initiator_id).single();
               setIncomingCall({
                 id: payload.new.id,
                 initiator: {
                   name: initiator?.full_name || "Unknown",
                   avatar: initiator?.avatar_url || null
                 }
               });
            }
          } else if (payload.eventType === "UPDATE") {
             if (payload.new.status === "ended" || payload.new.status === "missed") {
               setIncomingCall(null);
               if (payload.new.id === currentCallId) {
                 handleLeaveCall(); // Force leave if call ended remotely
               }
             }
          }
        }
      )
      // Broadcasts
      .on("broadcast", { event: "typing" }, (payload) => {
        const userId = payload.payload.user_id;
        if (userId !== currentUserId) {
          setTypingUsers(prev => new Set(prev).add(userId));
          if (typingTimeoutRef.current[userId]) clearTimeout(typingTimeoutRef.current[userId]);
          typingTimeoutRef.current[userId] = setTimeout(() => {
            setTypingUsers(prev => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          }, 3000);
        }
      })
      .on("broadcast", { event: "recording" }, (payload) => {
        const userId = payload.payload.user_id;
        if (userId !== currentUserId) {
          setRecordingUsers(prev => new Set(prev).add(userId));
          if (recordingTimeoutRef.current[userId]) clearTimeout(recordingTimeoutRef.current[userId]);
          recordingTimeoutRef.current[userId] = setTimeout(() => {
            setRecordingUsers(prev => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          }, 60000);
        }
      })
      .on("broadcast", { event: "stopped_recording" }, (payload) => {
        const userId = payload.payload.user_id;
        if (userId !== currentUserId) {
          setRecordingUsers(prev => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
          if (recordingTimeoutRef.current[userId]) clearTimeout(recordingTimeoutRef.current[userId]);
        }
      })
      // Presence
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat() as any[];
        
        // Online Users
        const uniqueUsers = new Set(users.map((u: any) => u.user_id));
        setOnlineUsersCount(uniqueUsers.size);

        // Call Participants
        const inCall = users.filter((u: any) => u.is_in_call);
        const uniqueInCall = Array.from(new Map(inCall.map((item: any) => [item.user_id, item])).values());
        setActiveCallParticipants(uniqueInCall);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            user_name: currentUserName,
            user_avatar: currentUserAvatar,
            online_at: new Date().toISOString(),
            is_in_call: false
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
        .from(table)
        .update({ read_by: newReadBy })
        .eq("id", msg.id);
    }
  };

  const markSingleMessageAsRead = async (messageId: string, currentReadBy: string[]) => {
    if (currentReadBy.includes(currentUserId)) return;
    
    const newReadBy = [...currentReadBy, currentUserId];
    await supabase
      .from(table)
      .update({ read_by: newReadBy })
      .eq("id", messageId);
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  const handleTyping = () => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId },
    });
  };

  const handleRecordingStatus = (isRec: boolean) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: isRec ? "recording" : "stopped_recording",
      payload: { user_id: currentUserId },
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!newMessage.trim()) return;
     
      const messageContent = newMessage.trim();
      setNewMessage("");
      setSending(true);

      const tempId = `temp-${Date.now()}`;
      const tempMessage: ChatMessage = {
        id: tempId,
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
        const { data, error } = await supabase.from(table).insert({
          [idColumn]: id, user_id: currentUserId, message: messageContent, message_type: "text", read_by: [currentUserId]
        }).select().single();

        if (error) throw error;

        setMessages((prev) => 
          prev.map(msg => msg.id === tempId ? {
            ...msg, 
            id: data.id, 
            created_at: data.created_at, 
            isTemp: false 
          } : msg)
        );
      } catch(e) { 
        console.error(e);
        toast.error("Failed to send"); 
        setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      } finally {
        setSending(false);
      }
  };
  
  // Voice Recording
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
        handleRecordingStatus(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      handleRecordingStatus(true);
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
      handleRecordingStatus(false);
      stopRecordingTimer();
      setRecordingDuration(0);
      audioChunksRef.current = [];
    }
  };

  const sendVoiceNote = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return;

    setSending(true);
    const duration = recordingDuration;
    setRecordingDuration(0);

    const tempId = `temp-audio-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      user_id: currentUserId,
      message: URL.createObjectURL(audioBlob),
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
      const fileName = `${id}/${currentUserId}/${timestamp}.webm`; // Use 'id' (contextId) for folder path

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const { data: msgData, error: msgError } = await supabase.from(table).insert({
        [idColumn]: id,
        user_id: currentUserId,
        message: publicUrl,
        message_type: "audio",
        read_by: [currentUserId],
        metadata: { duration }
      }).select().single();

      if (msgError) throw msgError;

      setMessages((prev) => 
        prev.map(msg => msg.id === tempId ? {
          ...msg, 
          id: msgData.id, 
          message: msgData.message, 
          created_at: msgData.created_at, 
          isTemp: false 
        } : msg)
      );

    } catch (error: any) {
      console.error("Error sending voice note:", error);
      toast.error("Failed to send voice note");
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // --- Call Handlers (Existing) ---
  const handleStartCall = async () => {
    try {
      const { data: call, error } = await supabase
        .from("call_logs")
        .insert({
          context_type: contextType,
          context_id: id,
          initiator_id: currentUserId,
          status: "waiting"
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentCallId(call.id);
      
      await supabase.from("call_participants").insert({
        call_id: call.id,
        user_id: currentUserId
      });

      channelRef.current?.track({
        user_id: currentUserId,
        user_name: currentUserName,
        user_avatar: currentUserAvatar,
        online_at: new Date().toISOString(),
        is_in_call: true,
        call_id: call.id
      });

      setIsInCall(true);
    } catch (err: any) {
      toast.error("Failed to start call: " + err.message);
    }
  };

  const handleJoinCall = async (callId?: string) => {
    const targetCallId = callId || incomingCall?.id;
    if (!targetCallId) return;

    try {
      setCurrentCallId(targetCallId);
      setIncomingCall(null);

      const { data: existingParticipant } = await supabase
        .from("call_participants")
        .select("id")
        .eq("call_id", targetCallId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (!existingParticipant) {
        await supabase.from("call_participants").insert({
          call_id: targetCallId,
          user_id: currentUserId
        });
      } else {
        await supabase.from("call_participants")
          .update({ left_at: null, joined_at: new Date().toISOString() })
          .eq("id", existingParticipant.id);
      }

       await supabase.from("call_logs").update({ status: "active" }).eq("id", targetCallId).eq("status", "waiting");

      channelRef.current?.track({
        user_id: currentUserId,
        user_name: currentUserName,
        user_avatar: currentUserAvatar,
        online_at: new Date().toISOString(),
        is_in_call: true,
        call_id: targetCallId
      });

      setIsInCall(true);
    } catch (err: any) {
      console.error("Error joining call:", err);
      toast.error("Failed to join call");
    }
  };

  const handleLeaveCall = async () => {
    if (!currentCallId) return;
    try {
      await supabase.from("call_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("call_id", currentCallId)
        .eq("user_id", currentUserId);

      channelRef.current?.track({
        user_id: currentUserId,
        user_name: currentUserName,
        user_avatar: currentUserAvatar,
        online_at: new Date().toISOString(),
        is_in_call: false
      });
      
      if (activeCallParticipants.length <= 1) {
         await supabase.from("call_logs")
           .update({ status: "ended", ended_at: new Date().toISOString() })
           .eq("id", currentCallId);
      }

      setIsInCall(false);
      setCurrentCallId(null);
    } catch (err) {
      console.error("Error leaving call", err);
    }
  };

  const handleIgnoreCall = () => {
    setIncomingCall(null);
  };


  // Helpers
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
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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

  if (isInCall && currentCallId) {
    return (
      <Card className="flex flex-col h-[600px] overflow-hidden">
        <CallInterface 
          callId={currentCallId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          onLeave={handleLeaveCall}
        />
      </Card>
    );
  }

  const IncomingCallOverlay = incomingCall ? (
    <CallNotification 
      callerName={incomingCall.initiator.name}
      callerAvatar={incomingCall.initiator.avatar}
      onJoin={() => handleJoinCall(incomingCall.id)}
      onIgnore={handleIgnoreCall}
    />
  ) : null;

  const typingCount = typingUsers.size;
  const recordingCount = recordingUsers.size;

  return (
    <Card className="flex flex-col h-[600px] max-h-full relative shadow-2xl border-border/50">
      {IncomingCallOverlay}
      
      <CardHeader className="border-b py-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
             <Dialog>
               <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" title="Call History">
                   <History className="h-4 w-4" />
                 </Button>
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Call History</DialogTitle>
                 </DialogHeader>
                 <CallHistory contextId={id} contextType={contextType} />
               </DialogContent>
             </Dialog>

            <Button 
              variant={activeCallParticipants.length > 0 || incomingCall ? "default" : "outline"}
              size="sm" 
              className={`h-8 gap-2 ${activeCallParticipants.length > 0 || incomingCall ? "bg-green-600 hover:bg-green-700 animate-pulse" : ""}`}
              onClick={() => {
                if (incomingCall) {
                  handleJoinCall(incomingCall.id);
                } else if (activeCallParticipants.length > 0) {
                  handleJoinCall(activeCallParticipants[0]?.call_id);
                } else {
                  handleStartCall();
                }
              }}
            >
              {activeCallParticipants.length > 0 || incomingCall ? (
                <>
                  <PhoneIncoming className="h-3 w-3" />
                  Join {activeCallParticipants.length > 0 ? `(${activeCallParticipants.length})` : "Call"}
                </>
              ) : (
                <>
                  <Phone className="h-3 w-3" />
                  Start Call
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-2 ml-2 border-l pl-2">
                <span className={`h-2 w-2 rounded-full ${onlineUsersCount > 1 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                 <span className="text-xs text-muted-foreground hidden sm:inline">
                  {onlineUsersCount > 1 ? `${onlineUsersCount} online` : "Offline"}
                </span>
            </div>
            {recordingCount > 0 && (
               <span className="text-[10px] text-red-500 font-medium animate-pulse ml-2 hidden sm:inline">
                {recordingCount === 1 ? "Someone is recording..." : "People are recording..."}
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
              </div>
            ) : (
              messages.map((message) => {
                 const isCurrentUser = message.user_id === currentUserId;
                 const isRead = isMessageRead(message);
                 const isAudio = message.message_type === 'audio';
                 const isExpired = isAudio && isVoiceNoteExpired(message.created_at);
                 
                 return (
                  <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8 mt-1"><AvatarImage src={message.sender_avatar || undefined} /><AvatarFallback>{message.sender_name.charAt(0)}</AvatarFallback></Avatar>
                    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} max-w-[80%]`}>
                       <div className={`rounded-2xl px-4 py-2 text-sm ${isCurrentUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"} ${message.isTemp ? "opacity-70" : ""}`}>
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
                            <p className="whitespace-pre-wrap break-words">{message.message}</p>
                          )}
                       </div>
                       <div className="flex items-center gap-1 mt-1 px-1">
                         <span className="text-[10px] text-muted-foreground">{formatMessageTime(message.created_at)}</span>
                         {isCurrentUser && (
                            <span title={isRead ? "Read by someone" : "Delivered"}>
                              {message.isTemp ? <Loader2 className="h-3 w-3 animate-spin" /> : isRead ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3" />}
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
        {typingCount > 0 && recordingCount === 0 && (
          <div className="absolute bottom-2 left-4 text-xs text-muted-foreground italic bg-background/80 px-2 py-1 rounded animate-pulse">
            {typingCount === 1 ? "Someone is typing..." : "People are typing..."}
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
