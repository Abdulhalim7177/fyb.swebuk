import { createClient } from "@/lib/supabase/server";

type SessionProcessingLog = {
  id: string;
  processed_at: string;
  academic_level_changes: {
    [key: string]: boolean;
  };
  created_by: string;
  notes: string | null;
  user_full_name: string;
};

export default async function SessionProcessingLogs() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return <div>Access denied</div>;
  }

  // Check if user has admin role
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData || profileData.role !== "admin") {
    return <div>Access denied</div>;
  }

  // Fetch session processing logs
  const { data: logs, error } = await supabase
    .from("session_processing_log")
    .select(`
      id,
      processed_at,
      academic_level_changes,
      created_by,
      notes
    `)
    .order('processed_at', { ascending: false });

  if (error) {
    console.error("Error fetching session processing logs:", error);
    return <div>Error fetching session processing logs</div>;
  }

  return (
    <div className="p-4 bg-background rounded-lg border">
      <h2 className="text-xl font-bold mb-4">Session Processing Logs</h2>

      {logs && logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Processed At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Processed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Changes Made</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {new Date(log.processed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {log.created_by || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    <ul className="list-disc pl-5 space-y-1">
                      {log.academic_level_changes?.['level_100_to_200'] && <li>Level 100 → Level 200</li>}
                      {log.academic_level_changes?.['level_200_to_300'] && <li>Level 200 → Level 300</li>}
                      {log.academic_level_changes?.['level_300_to_400'] && <li>Level 300 → Level 400</li>}
                      {log.academic_level_changes?.['level_400_to_alumni'] && <li>Level 400 → Alumni</li>}
                    </ul>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-4 text-muted-foreground">No session processing logs found</p>
      )}
    </div>
  );
}