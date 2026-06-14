import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { localStorageProvider } from '@/lib/storage/localStorageProvider';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get file metadata from Supabase
    const { data: file, error: dbError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (dbError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // 3. Delete from local storage
    let storageDeleteSuccess = false;
    try {
      await localStorageProvider.deleteFile(file.object_key);
      storageDeleteSuccess = true;
    } catch (deleteError) {
      console.error('Local storage delete error:', deleteError);
      // Continue with database deletion even if storage delete fails
    }

    // 4. Delete from Supabase
    const { error: deleteDbError } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (deleteDbError) {
      return NextResponse.json(
        { error: 'Failed to delete file metadata: ' + deleteDbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: storageDeleteSuccess 
        ? 'File deleted successfully from local storage and database'
        : 'File deleted from database but local storage deletion may have failed',
    });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}