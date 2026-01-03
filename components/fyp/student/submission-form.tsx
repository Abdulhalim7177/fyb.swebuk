"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitFYPDocument } from "@/lib/supabase/fyp-student-actions";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubmissionFormProps {
  fypId: string;
  approvedTypes?: string[];
}

export function SubmissionForm({ fypId, approvedTypes = [] }: SubmissionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const submissionOptions = [
    { value: "proposal", label: "Project Proposal" },
    { value: "chapter_1", label: "Chapter 1" },
    { value: "chapter_2", label: "Chapter 2" },
    { value: "chapter_3", label: "Chapter 3" },
    { value: "chapter_4", label: "Chapter 4" },
    { value: "chapter_5", label: "Chapter 5" },
    { value: "final_thesis", label: "Final Thesis (Complete Project)" },
  ];

  // Filter out already approved types
  const availableOptions = submissionOptions.filter(
    opt => !approvedTypes.includes(opt.value)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    // Store form reference before async operation
    const form = e.currentTarget;

    try {
      const formData = new FormData(form);
      formData.append("fypId", fypId);

      const result = await submitFYPDocument(formData);

      if (result.success) {
        toast.success("Submission created successfully");
        router.refresh();
        // Reset form
        form.reset();
        setSelectedFile(null);
      } else {
        toast.error(result.error || "Failed to create submission");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Create New Submission</CardTitle>
            <CardDescription className="mt-1">
              Submit proposals or upload progress reports for review
            </CardDescription>
          </div>
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submissionType" className="text-sm font-semibold">
                  Submission Type
                </Label>
                <Select name="submissionType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                    {availableOptions.length === 0 && (
                      <SelectItem value="none" disabled>
                        All chapters approved
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Title / Topic
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Week 8 Progress Update"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Details / Abstract
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="For proposals: Include objectives and scope.&#10;For reports: Summarize tasks completed."
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Right Column - File Upload */}
            <div className="flex flex-col">
              <Label htmlFor="file" className="text-sm font-semibold mb-2">
                Attachments
              </Label>
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer group relative">
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="bg-primary/10 rounded-full p-3 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  {selectedFile ? (
                    <>
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOCX, PPTX (Max 25MB)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const form = document.querySelector("form");
                form?.reset();
                setSelectedFile(null);
              }}
              disabled={isSubmitting}
            >
              Clear Form
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
