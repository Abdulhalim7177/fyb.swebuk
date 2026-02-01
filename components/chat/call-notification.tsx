"use client";

import { motion } from "framer-motion";
import { Phone, PhoneIncoming, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CallNotificationProps {
  callerName: string;
  callerAvatar: string | null;
  onJoin: () => void;
  onIgnore: () => void;
}

export function CallNotification({
  callerName,
  callerAvatar,
  onJoin,
  onIgnore,
}: CallNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="absolute top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="bg-background/95 backdrop-blur-md border border-primary/20 shadow-lg rounded-full p-2 pl-4 pr-2 flex items-center gap-4 max-w-md w-full ring-2 ring-primary/10 animate-pulse-ring">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={callerAvatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-background">
              <PhoneIncoming className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{callerName}</span>
            <span className="text-xs text-muted-foreground animate-pulse">Incoming call...</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onIgnore}
            title="Ignore"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-green-500 hover:bg-green-600 text-white px-4 h-9 gap-2 shadow-sm"
            onClick={onJoin}
          >
            <Phone className="h-3 w-3" />
            Join
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
