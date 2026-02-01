"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    full_name: string;
    avatar_url: string | null;
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
      const { data: logs, error } = await supabase
        .from("call_logs")
        .select(`
          *,
          initiator:initiator_id(full_name, avatar_url),
          call_participants(
            user_id
          )
        `)
        .eq("context_id", contextId)
        .eq("context_type", contextType)
        .order("started_at", { ascending: false });

      if (error) throw error;

      // Enhance with participant details if needed, 
      // but for now we just showing count or initiator is enough for list
      // To get full participant details we'd need a deeper join or separate fetch
      // Let's keep it simple: Show initiator and duration
      
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
    <ScrollArea className="h-[200px] w-full pr-4">
      <div className="space-y-3">
        {calls.map((call) => {
          const isMissed = call.status === 'missed' || (call.status === 'ended' && call.participants.length <= 1);
          
          return (
            <div key={call.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isMissed ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {isMissed ? <PhoneMissed className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {call.initiator.full_name}
                    {call.participants.length > 1 && (
                      <span className="text-muted-foreground font-normal ml-1">
                        +{call.participants.length - 1} others
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {format(new Date(call.started_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                 <Badge variant="outline" className="text-xs font-normal">
                   {isMissed ? "Missed" : getDuration(call.started_at, call.ended_at)}
                 </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
