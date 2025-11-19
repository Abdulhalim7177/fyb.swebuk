"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type AcademicSession = {
  id: string;
  session_name: string;
  start_date: string;
  end_date: string;
  semester: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function AcademicSessionForm() {
  const supabase = createClient();
  const [sessionName, setSessionName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [semester, setSemester] = useState("Semester I");
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Load existing sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academic_sessions')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching academic sessions:', error);
      setMessage({ type: 'error', text: 'Failed to load academic sessions' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const sessionData = {
        session_name: sessionName,
        start_date: startDate,
        end_date: endDate,
        semester,
        is_active: isActive,
      };

      let result;
      if (editingSession) {
        // Update existing session
        result = await supabase
          .from('academic_sessions')
          .update(sessionData)
          .eq('id', editingSession.id);
      } else {
        // Create new session
        result = await supabase
          .from('academic_sessions')
          .insert([sessionData]);
      }

      if (result.error) throw result.error;

      // Reset form
      setSessionName("");
      setStartDate("");
      setEndDate("");
      setSemester("Semester I");
      setIsActive(false);
      setEditingSession(null);
      setMessage({ type: 'success', text: editingSession ? 'Session updated successfully!' : 'Session created successfully!' });

      // Refresh the list
      fetchSessions();
    } catch (error) {
      console.error('Error saving academic session:', error);
      setMessage({ type: 'error', text: `Failed to ${editingSession ? 'update' : 'create'} session` });
    }
  };

  const handleEdit = (session: AcademicSession) => {
    setSessionName(session.session_name);
    setStartDate(session.start_date.split('T')[0]); // Format date properly
    setEndDate(session.end_date.split('T')[0]); // Format date properly
    setSemester(session.semester);
    setIsActive(session.is_active);
    setEditingSession(session);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this academic session?')) return;

    try {
      const { error } = await supabase
        .from('academic_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Session deleted successfully!' });
      fetchSessions();
    } catch (error) {
      console.error('Error deleting academic session:', error);
      setMessage({ type: 'error', text: 'Failed to delete session' });
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      // First, deactivate all sessions
      await supabase
        .from('academic_sessions')
        .update({ is_active: false })
        .neq('id', id);

      // Then activate the selected session
      const { error } = await supabase
        .from('academic_sessions')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Active session updated successfully!' });
      fetchSessions();
    } catch (error) {
      console.error('Error updating active session:', error);
      setMessage({ type: 'error', text: 'Failed to update active session' });
    }
  };

  const handleProcessSessionEnd = async () => {
    if (!confirm('Are you sure you want to process the end of the current academic session? This will increment student levels and transition level 400 students to alumni status. This action cannot be undone.')) {
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // Get the session token to pass to the API
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication error');
      }

      // Call the server action to process the academic session end
      const response = await fetch('/api/process-academic-session-end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        fetchSessions(); // Refresh the session list
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error processing academic session end:', error);
      setMessage({ type: 'error', text: 'Failed to process academic session end' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-background rounded-lg border">
        <h2 className="text-xl font-bold mb-4">
          {editingSession ? 'Edit Academic Session' : 'Create New Academic Session'}
        </h2>

        {message && (
          <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. 2024/2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <Label htmlFor="isActive">Is Active Session</Label>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button type="submit" className={editingSession ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"}>
              {editingSession ? 'Update Session' : 'Create Session'}
            </Button>

            {editingSession && (
              <Button
                type="button"
                variant="outline"
                className="border-2 hover:bg-muted"
                onClick={() => {
                  setEditingSession(null);
                  setSessionName("");
                  setStartDate("");
                  setEndDate("");
                  setSemester("Semester I");
                  setIsActive(false);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="p-4 bg-background rounded-lg border">
        <h2 className="text-xl font-bold mb-4">Process Academic Session End</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Process the end of the current academic session to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Increment level 100 students to level 200</li>
            <li>Increment level 200 students to level 300</li>
            <li>Increment level 300 students to level 400</li>
            <li>Transition level 400 students to alumni status</li>
            <li>Deactivate the current academic session</li>
          </ul>

          <Button
            onClick={handleProcessSessionEnd}
            disabled={processing}
            variant="destructive"
            className="mt-4"
          >
            {processing ? 'Processing...' : 'Process Academic Session End'}
          </Button>
        </div>
      </div>

      <div className="p-4 bg-background rounded-lg border">
        <h2 className="text-xl font-bold mb-4">Manage Academic Sessions</h2>

        {loading ? (
          <p>Loading sessions...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{session.session_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{session.start_date} to {session.end_date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{session.semester}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        session.is_active
                          ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                          : 'bg-gray-500/10 text-gray-700 dark:text-gray-300'
                      }`}>
                        {session.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {!session.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(session.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(session)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(session.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sessions.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">No academic sessions found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}