"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FYPChat } from "./fyp-chat";

interface FYPChatButtonProps {
  fypId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  supervisorName: string;
}

export function FYPChatButton({
  fypId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  supervisorName,
}: FYPChatButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <MessageSquare className="mr-2 h-4 w-4" />
          Project Chatroom
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat with {supervisorName}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="h-[500px]">
          <FYPChat
            fypId={fypId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
