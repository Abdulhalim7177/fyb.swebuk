"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { submitEventFeedback } from "@/lib/supabase/event-student-actions";
import { RATING_LABELS } from "@/lib/constants/events";

interface EventFeedbackFormProps {
  eventId: string;
  eventTitle: string;
  onSuccess?: () => void;
}

interface RatingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}

function RatingInput({ label, value, onChange, required }: RatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            onMouseEnter={() => setHoverValue(rating)}
            onMouseLeave={() => setHoverValue(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                rating <= (hoverValue || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {(hoverValue || value) > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {RATING_LABELS[(hoverValue || value) as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>
    </div>
  );
}

export function EventFeedbackForm({
  eventId,
  eventTitle,
  onSuccess,
}: EventFeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState({
    overall_rating: 0,
    content_rating: 0,
    organization_rating: 0,
    speaker_rating: 0,
    venue_rating: 0,
  });
  const [feedback, setFeedback] = useState({
    feedback_text: "",
    highlights: "",
    improvements: "",
  });
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ratings.overall_rating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    setLoading(true);

    const result = await submitEventFeedback(eventId, {
      ...ratings,
      ...feedback,
      is_anonymous: isAnonymous,
      content_rating: ratings.content_rating || undefined,
      organization_rating: ratings.organization_rating || undefined,
      speaker_rating: ratings.speaker_rating || undefined,
      venue_rating: ratings.venue_rating || undefined,
    });

    if (result.success) {
      toast.success(result.message);
      onSuccess?.();
    } else {
      toast.error(result.error || "Failed to submit feedback");
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Feedback</CardTitle>
        <CardDescription>
          Share your experience at &quot;{eventTitle}&quot;
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating - Required */}
          <RatingInput
            label="Overall Experience"
            value={ratings.overall_rating}
            onChange={(value) =>
              setRatings((prev) => ({ ...prev, overall_rating: value }))
            }
            required
          />

          {/* Optional Ratings */}
          <div className="grid gap-4 sm:grid-cols-2">
            <RatingInput
              label="Content Quality"
              value={ratings.content_rating}
              onChange={(value) =>
                setRatings((prev) => ({ ...prev, content_rating: value }))
              }
            />
            <RatingInput
              label="Organization"
              value={ratings.organization_rating}
              onChange={(value) =>
                setRatings((prev) => ({ ...prev, organization_rating: value }))
              }
            />
            <RatingInput
              label="Speakers/Presenters"
              value={ratings.speaker_rating}
              onChange={(value) =>
                setRatings((prev) => ({ ...prev, speaker_rating: value }))
              }
            />
            <RatingInput
              label="Venue/Platform"
              value={ratings.venue_rating}
              onChange={(value) =>
                setRatings((prev) => ({ ...prev, venue_rating: value }))
              }
            />
          </div>

          {/* Written Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback_text">Your Feedback</Label>
            <Textarea
              id="feedback_text"
              placeholder="Share your thoughts about the event..."
              value={feedback.feedback_text}
              onChange={(e) =>
                setFeedback((prev) => ({
                  ...prev,
                  feedback_text: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="highlights">What did you like most?</Label>
              <Textarea
                id="highlights"
                placeholder="Highlights of the event..."
                value={feedback.highlights}
                onChange={(e) =>
                  setFeedback((prev) => ({
                    ...prev,
                    highlights: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="improvements">Suggestions for improvement</Label>
              <Textarea
                id="improvements"
                placeholder="What could be better..."
                value={feedback.improvements}
                onChange={(e) =>
                  setFeedback((prev) => ({
                    ...prev,
                    improvements: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous">Submit Anonymously</Label>
              <p className="text-sm text-muted-foreground">
                Your name will not be shown with your feedback
              </p>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
