"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAcademicSessions, createAcademicSession, updateAcademicSession, deleteAcademicSession, promoteStudentsToNextLevel } from "@/lib/supabase/academic-actions";

export default function AcademicSessionsManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [selectedSessionForPromotion, setSelectedSessionForPromotion] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sessionName: "",
    startDate: "",
    endDate: "",
    semester: "Semester I",
    isActive: false,
  });
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAcademicSessions();
  }, []);

  const loadAcademicSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getAcademicSessions();
      if (result.success) {
        setSessions(result.sessions || []);
      } else {
        setError(result.error || "Failed to load academic sessions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdateSession = async () => {
    if (!formData.sessionName || !formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      if (editingSession) {
        // Update existing session
        const result = await updateAcademicSession(
          editingSession.id,
          formData.sessionName,
          formData.startDate,
          formData.endDate,
          formData.semester,
          formData.isActive
        );
        
        if (result.success) {
          setEditingSession(null);
          setIsModalOpen(false);
          setFormData({
            sessionName: "",
            startDate: "",
            endDate: "",
            semester: "Semester I",
            isActive: false,
          });
          loadAcademicSessions();
        } else {
          setError(result.error || "Failed to update session");
        }
      } else {
        // Create new session
        const result = await createAcademicSession(
          formData.sessionName,
          formData.startDate,
          formData.endDate,
          formData.semester,
          formData.isActive
        );

        if (result.success) {
          setIsModalOpen(false);
          setFormData({
            sessionName: "",
            startDate: "",
            endDate: "",
            semester: "Semester I",
            isActive: false,
          });
          loadAcademicSessions();
        } else {
          setError(result.error || "Failed to create session");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const handleEdit = (session: any) => {
    setEditingSession(session);
    setFormData({
      sessionName: session.session_name,
      startDate: session.start_date,
      endDate: session.end_date,
      semester: session.semester,
      isActive: session.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this academic session? This action cannot be undone.")) {
      try {
        const result = await deleteAcademicSession(sessionId);
        if (result.success) {
          loadAcademicSessions();
        } else {
          setError(result.error || "Failed to delete session");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    }
  };

  const handlePromoteStudents = async () => {
    if (!selectedSessionForPromotion) return;

    try {
      const result = await promoteStudentsToNextLevel(selectedSessionForPromotion);
      if (result.success) {
        setIsPromotionModalOpen(false);
        setSelectedSessionForPromotion(null);
        alert(`Successfully promoted ${result.count} students!`);
      } else {
        setError(result.error || "Failed to promote students");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Manage Academic Sessions</h2>
          <p className="text-muted-foreground">
            Create and manage academic sessions for the university.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPromotionModalOpen} onOpenChange={setIsPromotionModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Promote Students
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Promote Students to Next Level</DialogTitle>
                <DialogDescription>
                  Select an academic session to promote all students to the next level.
                  This will move Level 100 to Level 200, Level 200 to Level 300, Level 300 to Level 400,
                  and Level 400 students will become Alumni.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="session-select">Session:</Label>
                  <Select 
                    value={selectedSessionForPromotion || ""} 
                    onValueChange={setSelectedSessionForPromotion}
                  >
                    <SelectTrigger className="w-full col-span-3">
                      <SelectValue placeholder="Select a session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map(session => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.session_name} ({session.semester})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPromotionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePromoteStudents}
                  disabled={!selectedSessionForPromotion}
                >
                  Promote Students
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSession ? "Edit Academic Session" : "Create Academic Session"}</DialogTitle>
                <DialogDescription>
                  {editingSession 
                    ? "Update the information for this academic session." 
                    : "Fill in the details for the new academic session."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sessionName">Session Name *</Label>
                  <Input
                    id="sessionName"
                    value={formData.sessionName}
                    onChange={(e) => setFormData({...formData, sessionName: e.target.value})}
                    className="col-span-3"
                    placeholder="e.g., 2024/2025"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="semester">Semester</Label>
                  <Select 
                    value={formData.semester} 
                    onValueChange={(value) => setFormData({...formData, semester: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semester I">Semester I</SelectItem>
                      <SelectItem value="Semester II">Semester II</SelectItem>
                      <SelectItem value="Rain Semester">Rain Semester</SelectItem>
                      <SelectItem value="Dry Semester">Dry Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive">Active Session</Label>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="col-span-3 h-5 w-5"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSession(null);
                    setFormData({
                      sessionName: "",
                      startDate: "",
                      endDate: "",
                      semester: "Semester I",
                      isActive: false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateOrUpdateSession}>
                  {editingSession ? "Update Session" : "Create Session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Academic Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No academic sessions found. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.session_name}</TableCell>
                      <TableCell>
                        {new Date(session.start_date).toLocaleDateString()} - {" "}
                        {new Date(session.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{session.semester}</TableCell>
                      <TableCell>
                        {session.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(session)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}