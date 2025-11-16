import { createClient } from './client';
import { createClient as createServerClient } from './server';

/**
 * Utility function to get a properly formatted storage URL
 * that works both in local development and production
 */
export async function getStorageUrl(
  bucketName: string,
  filePath: string,
  isSigned: boolean = true,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url: string | null; error: any }> {
  try {
    // For server-side usage
    if (typeof window === 'undefined') {
      const supabase = await createServerClient();
      if (isSigned) {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, expiresIn);

        if (error) {
          console.error('Error creating signed URL:', error);
          // Fallback to public URL
          const { data: publicData } = await supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          return { url: publicData?.publicUrl || null, error };
        }
        return { url: data?.signedUrl || null, error: null };
      } else {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        return { url: data?.publicUrl || null, error };
      }
    }
    // For client-side usage
    else {
      const supabase = createClient();
      if (isSigned) {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, expiresIn);

        if (error) {
          console.error('Error creating signed URL:', error);
          // Fallback to public URL
          const { data: publicData } = await supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          return { url: publicData?.publicUrl || null, error };
        }
        return { url: data?.signedUrl || null, error: null };
      } else {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        return { url: data?.publicUrl || null, error };
      }
    }
  } catch (error) {
    console.error('Unexpected error in getStorageUrl:', error);
    return { url: null, error };
  }
}

/**
 * Get the base storage URL for the current Supabase instance
 * Useful for handling local vs production URLs correctly
 */
export function getSupabaseStorageBaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }

  // Construct the storage URL based on the supabase URL
  // For local development it should be http://localhost:54321/storage/v1
  // For production it would be something like https://[project-ref].supabase.co/storage/v1
  return `${supabaseUrl}/storage/v1`;
}

/**
 * Special function to handle signed URLs in local development
 * due to common CORS and endpoint issues
 */
export async function getLocalSignedUrl(
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: any }> {
  // This function addresses a common issue with signed URLs in local Supabase development
  // where the standard createSignedUrl sometimes returns URLs that don't work properly

  if (typeof window === 'undefined') {
    // Server-side
    const supabase = await createServerClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      // Fallback to public URL for local development
      const { data: publicData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      return { url: publicData?.publicUrl || null, error };
    }
    return { url: data?.signedUrl || null, error: null };
  } else {
    // Client-side
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      // Fallback to public URL for local development
      const { data: publicData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      return { url: publicData?.publicUrl || null, error };
    }
    return { url: data?.signedUrl || null, error: null };
  }
}