"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Calendar,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RegistrationConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "success" | "error" | "waitlisted" | "existing";
  message?: string;
  eventTitle?: string;
  hasAccount?: boolean;
  additionalInfo?: {
    eventDate?: string;
    location?: string;
  };
}

export function RegistrationConfirmationModal({
  open,
  onOpenChange,
  status,
  message,
  eventTitle,
  hasAccount = false,
  additionalInfo,
}: RegistrationConfirmationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && status === "success") {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open, status]);

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-500",
          bgGradient: "from-green-500/20 via-green-500/10 to-transparent",
          title: "Registration Successful! 🎉",
          subtitle: message || "You're all set for the event",
        };
      case "waitlisted":
        return {
          icon: Clock,
          iconColor: "text-yellow-500",
          bgGradient: "from-yellow-500/20 via-yellow-500/10 to-transparent",
          title: "Added to Waitlist",
          subtitle:
            message || "We'll notify you if a spot becomes available",
        };
      case "error":
        return {
          icon: XCircle,
          iconColor: "text-red-500",
          bgGradient: "from-red-500/20 via-red-500/10 to-transparent",
          title: "Registration Failed",
          subtitle: message || "Please try again or contact support",
        };
      case "existing":
        return {
          icon: CheckCircle2,
          iconColor: "text-blue-500",
          bgGradient: "from-blue-500/20 via-blue-500/10 to-transparent",
          title: "Already Registered",
          subtitle: message || "You're already signed up for this event",
        };
      default:
        return {
          icon: CheckCircle2,
          iconColor: "text-primary",
          bgGradient: "from-primary/20 via-primary/10 to-transparent",
          title: "Confirmed",
          subtitle: message || "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md"
            >
              {/* Confetti effect for success */}
              {showConfetti && status === "success" && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: "50%",
                        y: "50%",
                        scale: 0,
                        rotate: 0,
                      }}
                      animate={{
                        x: `${Math.random() * 200 - 100}%`,
                        y: `${Math.random() * 200 - 100}%`,
                        scale: [0, 1, 0.5, 0],
                        rotate: Math.random() * 360,
                      }}
                      transition={{
                        duration: 2,
                        ease: "easeOut",
                        delay: Math.random() * 0.3,
                      }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: [
                          "#ef4444",
                          "#f59e0b",
                          "#10b981",
                          "#3b82f6",
                          "#8b5cf6",
                        ][i % 5],
                        left: "50%",
                        top: "50%",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Card */}
              <div className="relative bg-card rounded-2xl shadow-2xl border overflow-hidden">
                {/* Gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-50`}
                />

                {/* Close button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-4 right-4 z-10 p-1 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>

                {/* Content */}
                <div className="relative p-8 space-y-6">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: 0.2,
                    }}
                    className="flex justify-center"
                  >
                    <div className="relative">
                      <div
                        className={`absolute inset-0 ${config.iconColor} opacity-20 blur-xl`}
                      />
                      <Icon
                        className={`h-20 w-20 ${config.iconColor} relative`}
                        strokeWidth={1.5}
                      />
                    </div>
                  </motion.div>

                  {/* Title and subtitle */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-2"
                  >
                    <h2 className="text-2xl font-bold">{config.title}</h2>
                    <p className="text-muted-foreground">{config.subtitle}</p>
                  </motion.div>

                  {/* Event details */}
                  {eventTitle && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-4 bg-muted/50 rounded-xl backdrop-blur-sm space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Event</p>
                          <p className="text-sm text-muted-foreground">
                            {eventTitle}
                          </p>
                        </div>
                      </div>

                      {additionalInfo?.eventDate && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">Date & Time</p>
                            <p className="text-sm text-muted-foreground">
                              {additionalInfo.eventDate}
                            </p>
                          </div>
                        </div>
                      )}

                      {status === "success" && !hasAccount && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">
                              Confirmation Email
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Check your inbox for details
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Additional info for guests */}
                  {status === "success" && !hasAccount && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-4 bg-primary/10 border border-primary/20 rounded-xl"
                    >
                      <p className="text-sm text-center">
                        <span className="font-medium">Pro tip:</span> Create an
                        account to manage your registrations and get
                        personalized recommendations!
                      </p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col gap-2"
                  >
                    {status === "success" && hasAccount && (
                      <Link href="/dashboard/student/events">
                        <Button className="w-full group" size="lg">
                          View My Events
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}

                    {status === "success" && !hasAccount && (
                      <Link href="/auth/signup">
                        <Button className="w-full group" size="lg">
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}

                    {status === "waitlisted" && hasAccount && (
                      <Link href="/dashboard/student/events">
                        <Button className="w-full" size="lg" variant="default">
                          View Dashboard
                        </Button>
                      </Link>
                    )}

                    {status === "existing" && hasAccount && (
                      <Link href="/auth/login">
                        <Button className="w-full" size="lg" variant="default">
                          Sign In to Continue
                        </Button>
                      </Link>
                    )}

                    {status === "existing" && !hasAccount && (
                      <Link href="/auth/login">
                        <Button className="w-full" size="lg" variant="default">
                          View Registration
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant={status === "success" || status === "waitlisted" ? "outline" : "default"}
                      size="lg"
                      onClick={() => onOpenChange(false)}
                      className="w-full"
                    >
                      {status === "error" ? "Close" : "Done"}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
