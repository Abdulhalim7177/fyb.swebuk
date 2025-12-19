'use server';

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Function to process the end of an academic session:
 * 1. Increment student levels (100 -> 200, 200 -> 300, 300 -> 400)
 * 2. Transition level_400 students to alumni status
 */
export async function processAcademicSessionEnd() {
  const supabase = await createClient();

  try {
    // First, check if the user is an admin
    const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData || (profileData.role !== 'admin' && profileData.role !== 'staff')) {
      throw new Error('Only admins and staff can process academic session end');
    }

    // Update level_300 students to level_400
    const { error: update300to400Error } = await supabase
      .from('profiles')
      .update({ academic_level: 'level_400' })
      .eq('academic_level', 'level_300');

    if (update300to400Error) {
      throw new Error(`Error updating level_300 to level_400: ${update300to400Error.message}`);
    }

    // Update level_200 students to level_300
    const { error: update200to300Error } = await supabase
      .from('profiles')
      .update({ academic_level: 'level_300' })
      .eq('academic_level', 'level_200');

    if (update200to300Error) {
      throw new Error(`Error updating level_200 to level_300: ${update200to300Error.message}`);
    }

    // Update level_100 students to level_200
    const { error: update100to200Error } = await supabase
      .from('profiles')
      .update({ academic_level: 'level_200' })
      .eq('academic_level', 'level_100');

    if (update100to200Error) {
      throw new Error(`Error updating level_100 to level_200: ${update100to200Error.message}`);
    }

    // Update level_400 students to alumni
    const { error: update400toAlumniError } = await supabase
      .from('profiles')
      .update({ academic_level: 'alumni' })
      .eq('academic_level', 'level_400');

    if (update400toAlumniError) {
      throw new Error(`Error updating level_400 to alumni: ${update400toAlumniError.message}`);
    }

    // Deactivate the current academic session
    const { error: deactivateError } = await supabase
      .from('academic_sessions')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      throw new Error(`Error deactivating current session: ${deactivateError.message}`);
    }

    // Create a record of this session processing for audit purposes
    await supabase
      .from('session_processing_log')
      .insert({
        processed_at: new Date().toISOString(),
        academic_level_changes: {
          'level_100_to_200': true,
          'level_200_to_300': true,
          'level_300_to_400': true,
          'level_400_to_alumni': true,
        },
        created_by: user.id
      });

    // Revalidate the academic sessions page
    revalidatePath('/dashboard/admin/academic-sessions');

    return {
      success: true,
      message: "Academic session end processed successfully. Student levels updated and alumni status applied where appropriate."
    };
  } catch (error) {
    console.error("Error processing academic session end:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred while processing the academic session end"
    };
  }
}

/**
 * Function to create a session processing log table (for audit purposes)
 */
export async function initializeSessionProcessingLog() {
  const supabase = await createClient();

  // Create the table if it doesn't exist (this should ideally be done in a migration)
  // For now, we assume it's created via migration
  try {
    const { data, error } = await supabase
      .from('session_processing_log')
      .select('id')
      .limit(1);

    if (error) {
      console.log('Session processing log table may not exist yet:', error.message);
      // The table should be created via migration
    }
  } catch (error) {
    console.log('Error checking session processing log table:', error);
  }
}