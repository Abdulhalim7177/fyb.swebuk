"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface CallLog {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: 'waiting' | 'active' | 'ended' | 'missed';
  initiator: {
    full_name: string;
    avatar_url: string | null;
  };
  participants: {
    user_id: string;
    profile?: {
      full_name: string;
      avatar_url: string | null;
    };
  }[];
}

interface CallHistoryProps {
  contextId: string;
  contextType: string;
}

export function CallHistory({ contextId, contextType }: CallHistoryProps) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallHistory();
  }, [contextId]);

  const fetchCallHistory = async () => {
    const supabase = createClient();
    try {
      // Fetch logs
      type CallLogWithParticipants = {
        id: string;
        started_at: string;
        ended_at: string | null;
        status: 'waiting' | 'active' | 'ended' | 'missed';
        initiator: {
          full_name: string;
          avatar_url: string | null;
        } | null;
        call_participants: {
          user_id: string;
          profile: {
            full_name: string;
            avatar_url: string | null;
          } | null;
        }[];
      };

      const { data: logs, error } = await supabase
        .from("call_logs")
        .select(`
          *,
          initiator:initiator_id(full_name, avatar_url),
          call_participants(
            user_id,
            profile:user_id(full_name, avatar_url)
          )
        `)
        .eq("context_id", contextId)
        .eq("context_type", contextType)
        .order("started_at", { ascending: false })
        .returns<CallLogWithParticipants[]>();

      if (error) throw error;

      const formattedLogs: CallLog[] = logs.map((log: any) => ({
        id: log.id,
        started_at: log.started_at,
        ended_at: log.ended_at,
        status: log.status,
        initiator: log.initiator || { full_name: "Unknown", avatar_url: null },
        participants: log.call_participants || []
      }));

      setCalls(formattedLogs);
    } catch (err) {
      console.error("Error fetching call history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return "Ongoing";
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading history...</div>;

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
        <Phone className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm">No call history</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full pr-4">
      <div className="space-y-2">
        {calls.map((call) => {
          const isMissed = call.status === 'missed' || (call.status === 'ended' && call.participants.length <= 1);
          const participantCount = call.participants.length;

          return (
            <HoverCard key={call.id}>
              <HoverCardTrigger asChild>
                <button className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-pointer group outline-none">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full transition-colors ${isMissed ? 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20'}`}>
                      {isMissed ? <PhoneMissed className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="text-sm font-medium">{call.initiator.full_name}</p>
                         {participantCount > 0 && (
                           <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                             <Users className="h-3 w-3" />
                             {participantCount}
                           </span>
                         )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(call.started_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                     {isMissed ? "Missed" : getDuration(call.started_at, call.ended_at)}
                  </Badge>
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 max-w-[calc(100vw-2rem)] p-0 overflow-hidden" align="start">
                <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                   <span className="text-sm font-medium">Call Details</span>
                   <span className="text-xs text-muted-foreground">{format(new Date(call.started_at), "PP p")}</span>
                </div>
                <div className="p-3 space-y-3">
                   {/* Initiator */}
                   <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={call.initiator.avatar_url || undefined} />
                        <AvatarFallback>{call.initiator.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{call.initiator.full_name}</span>
                        <span className="text-xs text-muted-foreground">Initiator</span>
                      </div>
                   </div>
                   
                   {/* Participants */}
                   {call.participants.length > 0 && (
                     <>
                       <div className="h-px bg-border" />
                       <div className="space-y-2">
                         <span className="text-xs font-semibold text-muted-foreground uppercase">Participants ({call.participants.length})</span>
                         <div className="grid grid-cols-1 gap-2">
                           {call.participants.map((p) => (
                             <div key={p.user_id} className="flex items-center gap-2">
                               <Avatar className="h-6 w-6">
                                 <AvatarImage src={p.profile?.avatar_url || undefined} />
                                 <AvatarFallback>{p.profile?.full_name?.charAt(0) || "?"}</AvatarFallback>
                               </Avatar>
                               <span className="text-sm text-foreground/80">{p.profile?.full_name || "Unknown"}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     </>
                   )}
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </ScrollArea>
  );
}
