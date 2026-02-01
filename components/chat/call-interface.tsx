"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Users, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface CallParticipant {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  joined_at: string;
  is_muted: boolean;
  is_video_on: boolean;
  is_speaking: boolean;
}

interface CallInterfaceProps {
  callId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  onLeave: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function CallInterface({
  callId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onLeave,
}: CallInterfaceProps) {
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");

  // WebRTC Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const channelRef = useRef<any>(null);
  const supabase = createClient();

  // 1. Initialization Effect
  useEffect(() => {
    let mounted = true;

    const setupCall = async () => {
      try {
        setConnectionStatus("Accessing Microphone...");
        // Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: false 
        });
        localStreamRef.current = stream;

        if (!mounted) return;

        setConnectionStatus("Joining Room...");
        
        // Create Dedicated Channel
        const channel = supabase.channel(`call_room:${callId}`, {
          config: {
            presence: {
              key: currentUserId,
            },
          },
        });

        channelRef.current = channel;

        // Setup Listeners
        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            console.log("Presence Sync:", state);
            
            const currentUsers = Object.values(state)
              .flat()
              .map((u: any) => ({
                user_id: u.user_id,
                user_name: u.user_name || "Unknown",
                user_avatar: u.user_avatar,
                joined_at: u.joined_at,
                is_muted: u.is_muted,
                is_video_on: u.is_video_on,
                is_speaking: false
              }))
              .filter(u => u.user_id !== currentUserId);

            // Deduplicate based on user_id
            const uniqueUsers = Array.from(new Map(currentUsers.map((item: any) => [item.user_id, item])).values()) as CallParticipant[];
            
            setParticipants(uniqueUsers);
            
            // Manage Connections
            uniqueUsers.forEach(user => {
              if (!peersRef.current[user.user_id]) {
                const shouldInitiate = currentUserId > user.user_id;
                console.log(`Connection check for ${user.user_name} (${user.user_id}). Initiator: ${shouldInitiate}`);
                // Always create PC, but only create offer if initiator
                createPeerConnection(user.user_id, shouldInitiate, channel);
              }
            });

            // Cleanup stale peers
            const activeIds = uniqueUsers.map(u => u.user_id);
            Object.keys(peersRef.current).forEach(id => {
              if (!activeIds.includes(id)) {
                console.log("Removing stale peer:", id);
                peersRef.current[id].close();
                delete peersRef.current[id];
              }
            });
          })
          .on("broadcast", { event: "signal" }, async ({ payload }) => {
            await handleSignal(payload, channel);
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              setConnectionStatus("Connected");
              await channel.track({
                user_id: currentUserId,
                user_name: currentUserName,
                user_avatar: currentUserAvatar,
                joined_at: new Date().toISOString(),
                is_muted: false,
                is_video_on: false,
              });
            }
          });

      } catch (error) {
        console.error("Error setting up call:", error);
        toast.error("Failed to access microphone or connect.");
        setConnectionStatus("Error");
      }
    };

    setupCall();

    return () => {
      mounted = false;
      cleanupCall();
    };
  }, [callId]); // Re-run if callId changes (shouldn't happen in-call but safe)

  // 2. Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (participants.length > 0) {
       timer = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [participants.length]);

  const cleanupCall = () => {
    console.log("Cleaning up call resources...");
    // Stop local tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    
    // Close all peer connections
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    
    // Leave channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const createPeerConnection = (targetUserId: string, initiator: boolean, channel: any) => {
    if (peersRef.current[targetUserId]) return peersRef.current[targetUserId];

    console.log(`Creating PeerConnection for ${targetUserId} (Initiator: ${initiator})`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetUserId] = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "candidate",
            target: targetUserId,
            candidate: event.candidate,
            sender: currentUserId
          }
        });
      }
    };

    // Handle Remote Stream
    pc.ontrack = (event) => {
      console.log(`Received remote track from ${targetUserId}`);
      const remoteAudio = document.getElementById(`audio-${targetUserId}`) as HTMLAudioElement;
      if (remoteAudio) {
        remoteAudio.srcObject = event.streams[0];
        // Ensure playback
        remoteAudio.play().catch(e => console.error("Auto-play failed:", e));
      }
    };

    // Negotiation
    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(`Sending OFFER to ${targetUserId}`);
          channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "offer",
              target: targetUserId,
              sdp: pc.localDescription,
              sender: currentUserId
            }
          });
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      };
    }

    return pc;
  };

  const handleSignal = async (payload: any, channel: any) => {
    const { type, target, sender, sdp, candidate } = payload;
    if (target !== currentUserId) return; // Not for us

    console.log(`Received Signal ${type} from ${sender}`);
    
    // Ensure we have a PC (if we are the receiver/answerer)
    const pc = peersRef.current[sender] || createPeerConnection(sender, false, channel);

    try {
      if (type === "offer") {
        if (pc.signalingState !== "stable") {
           // Collision handling or restart? usually roll with it if we are answerer
           console.warn("Received offer in non-stable state, ignoring or handling carefully.");
           await Promise.all([
             pc.setLocalDescription({type: "rollback"} as any),
             pc.setRemoteDescription(new RTCSessionDescription(sdp))
           ]);
        } else {
           await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`Sending ANSWER to ${sender}`);
        channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "answer",
            target: sender,
            sdp: pc.localDescription,
            sender: currentUserId
          }
        });
      } else if (type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } else if (type === "candidate") {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("Signal handling error:", err);
    }
  };

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !newState);
    }
    // Update presence
    channelRef.current?.track({
      user_id: currentUserId,
      user_name: currentUserName,
      user_avatar: currentUserAvatar,
      joined_at: new Date().toISOString(),
      is_muted: newState,
      is_video_on: isVideoOn,
    });
  };

  const toggleVideo = () => {
    toast.info("Video is disabled for this version.");
  };

  const handleEndCall = () => {
    // We rely on cleanupCall via unmount to leave presence
    onLeave();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${participants.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="font-semibold text-sm">
            {participants.length > 0 ? "Active Call" : "Waiting for others..."}
          </span>
          <span className="text-xs text-muted-foreground ml-2">{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-4 w-4" />
          {participants.length + 1}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Self */}
          <motion.div
              layout
              className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border group"
            >
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <Avatar className="h-20 w-20 ring-4 ring-background/10">
                  <AvatarImage src={currentUserAvatar || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {currentUserName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
             </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium truncate">You {isMuted && "(Muted)"}</span>
                </div>
              </div>
          </motion.div>

          {/* Peers */}
          {participants.map((participant) => (
            <motion.div
              key={participant.user_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
              className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border group"
            >
              {/* Audio Element */}
              <audio id={`audio-${participant.user_id}`} autoPlay playsInline />

              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                   <Avatar className="h-20 w-20 ring-4 ring-background/10">
                    <AvatarImage src={participant.user_avatar || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {participant.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium truncate">
                    {participant.user_name}
                  </span>
                  <div className="flex gap-1.5">
                     {participant.is_muted && (
                       <div className="bg-red-500/80 p-1 rounded-full">
                         <MicOff className="h-3 w-3 text-white" />
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t flex justify-center gap-4 bg-muted/20">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          variant={isVideoOn ? "default" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleVideo}
          disabled={true} 
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-14 w-14 shadow-lg hover:bg-red-600 transition-all hover:scale-105"
          onClick={handleEndCall}
          title="End Call"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}