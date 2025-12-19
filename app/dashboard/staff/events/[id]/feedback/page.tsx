import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEventForManagement } from "@/lib/supabase/event-staff-actions";
import { getEventFeedback, getEventFeedbackStats } from "@/lib/supabase/event-actions";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";

export default async function EventFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check authorization
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const [event, feedback, feedbackStats] = await Promise.all([
    getEventForManagement(id),
    getEventFeedback(id),
    getEventFeedbackStats(id),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/staff/events/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">Event Feedback</p>
        </div>
      </div>

      {feedbackStats && feedbackStats.total_feedback > 0 ? (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackStats.total_feedback}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {feedbackStats.average_overall.toFixed(1)}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Content Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackStats.average_content?.toFixed(1) || "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Organization Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackStats.average_organization?.toFixed(1) || "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm w-4">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${
                            (feedbackStats.rating_distribution[
                              rating as keyof typeof feedbackStats.rating_distribution
                            ] /
                              feedbackStats.total_feedback) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {
                        feedbackStats.rating_distribution[
                          rating as keyof typeof feedbackStats.rating_distribution
                        ]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <Card>
            <CardHeader>
              <CardTitle>All Feedback</CardTitle>
              <CardDescription>
                {feedback.length} responses from attendees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {feedback.map((fb) => (
                  <div key={fb.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= fb.overall_rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            by {fb.user_name || "Anonymous"}
                          </span>
                        </div>
                        <p className="text-sm">{fb.feedback_text || "No comment provided"}</p>
                      </div>
                    </div>
                    {(fb.content_rating || fb.organization_rating || fb.speaker_rating || fb.venue_rating) && (
                      <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                        {fb.content_rating && (
                          <div>
                            <span className="text-muted-foreground">Content: </span>
                            <span className="font-medium">{fb.content_rating}/5</span>
                          </div>
                        )}
                        {fb.organization_rating && (
                          <div>
                            <span className="text-muted-foreground">Organization: </span>
                            <span className="font-medium">{fb.organization_rating}/5</span>
                          </div>
                        )}
                        {fb.speaker_rating && (
                          <div>
                            <span className="text-muted-foreground">Speaker: </span>
                            <span className="font-medium">{fb.speaker_rating}/5</span>
                          </div>
                        )}
                        {fb.venue_rating && (
                          <div>
                            <span className="text-muted-foreground">Venue: </span>
                            <span className="font-medium">{fb.venue_rating}/5</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Feedback Yet</h3>
              <p className="text-muted-foreground">
                Attendees haven't submitted any feedback for this event yet
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
