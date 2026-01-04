"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Search } from "lucide-react";
import { BulkAssignmentDialog } from "./bulk-assignment-dialog";
import { StudentAssignmentDialog } from "./student-assignment-dialog";

interface AssignmentViewProps {
  students: Array<{
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    academic_level: number;
    has_fyp: boolean;
    fyp: {
      id: string;
      title: string;
      status: string;
      supervisor_id: string | null;
    } | null;
  }>;
  supervisors: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  fyps: Array<{
    id: string;
    title: string;
    student: {
      full_name: string;
      avatar_url: string | null;
    } | null;
    created_at: string;
  }>;
}

export function AssignmentView({
  students,
  supervisors,
  fyps,
}: AssignmentViewProps) {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  function handleStudentAction(student: typeof students[0]) {
    setSelectedStudentId(student.id);
    setStudentDialogOpen(true);
  }

  // Filter students based on search and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "unassigned" && !student.has_fyp) ||
      (filterStatus === "assigned" && student.has_fyp);

    return matchesSearch && matchesFilter;
  });

  const unassignedStudents = students.filter((s) => !s.has_fyp);
  const assignedStudents = students.filter((s) => s.has_fyp);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
              className="flex-1 sm:flex-none"
            >
              All ({students.length})
            </Button>
            <Button
              variant={filterStatus === "unassigned" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("unassigned")}
              className="flex-1 sm:flex-none text-amber-600"
            >
              Unassigned ({unassignedStudents.length})
            </Button>
            <Button
              variant={filterStatus === "assigned" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("assigned")}
              className="flex-1 sm:flex-none text-green-600"
            >
              Assigned ({assignedStudents.length})
            </Button>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {fyps.length > 0 && (
            <Button variant="outline" onClick={() => setBulkDialogOpen(true)} className="flex-1 sm:flex-none">
              <Users className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Bulk Assign</span>
              <span className="sm:hidden">Bulk</span>
            </Button>
          )}
          <Button onClick={() => {
            setSelectedStudentId(null);
            setStudentDialogOpen(true);
          }} className="flex-1 sm:flex-none">
            <UserPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Assign Student</span>
            <span className="sm:hidden">Assign</span>
          </Button>
        </div>
      </div>

      {/* Student List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="grid" className="flex-1 sm:flex-none">Grid View</TabsTrigger>
          <TabsTrigger value="list" className="flex-1 sm:flex-none">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </CardContent>
              </Card>
            ) : (
              filteredStudents.map((student) => (
                <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={student.avatar_url || undefined} />
                        <AvatarFallback>
                          {student.full_name?.charAt(0) || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {student.full_name}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {student.email}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1 text-[10px] sm:text-xs"
                        >
                          Level {student.academic_level}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {student.has_fyp ? (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 w-fit">
                          Assigned
                        </Badge>
                        <p className="text-sm font-medium truncate">
                          {student.fyp?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {student.fyp?.status?.replace(/_/g, " ")}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleStudentAction(student)}
                        >
                          Reassign Supervisor
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 w-fit"
                        >
                          Not Assigned
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          No FYP project assigned yet
                        </p>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleStudentAction(student)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assign to Supervisor
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              {filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={student.avatar_url || undefined} />
                          <AvatarFallback>
                            {student.full_name?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        {student.has_fyp ? (
                          <>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 truncate max-w-[150px] hidden sm:inline-flex">
                              {student.fyp?.title}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handleStudentAction(student)}
                            >
                              Reassign
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hidden sm:inline-flex"
                            >
                              Unassigned
                            </Badge>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handleStudentAction(student)}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Assignment Dialog */}
      <BulkAssignmentDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        fyps={fyps}
        supervisors={supervisors}
        onSuccess={() => {
          // Refresh will happen automatically due to revalidatePath
        }}
      />

      {/* Student Assignment Dialog */}
      <StudentAssignmentDialog
        open={studentDialogOpen}
        onOpenChange={(open) => {
          setStudentDialogOpen(open);
          if (!open) setSelectedStudentId(null);
        }}
        students={selectedStudent ? [selectedStudent] : students}
        supervisors={supervisors}
        onSuccess={() => {
          // Refresh will happen automatically due to revalidatePath
        }}
      />
    </div>
  );
}
