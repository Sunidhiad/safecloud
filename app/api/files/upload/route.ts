import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { localStorageProvider } from '@/lib/storage/localStorageProvider';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large files

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user with Supabase
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

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;

    // 3. Validate file
    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'No file provided or file is empty' },
        { status: 400 }
      );
    }

    // Validate file size (e.g., 100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // 4. Generate object key for local storage
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folderPath = folderId || 'root';
    const objectKey = `${user.id}/${folderPath}/${timestamp}-${safeFileName}`;

    // 5. Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 6. Upload to local storage
    let uploadedKey: string;
    try {
      uploadedKey = await localStorageProvider.uploadFile(objectKey, buffer, file.type);
    } catch (uploadError) {
      console.error('Local storage upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // 7. Save metadata to Supabase
    const { data: fileData, error: dbError } = await supabase
      .from('files')
      .insert({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        owner_id: user.id,
        folder_id: folderId || null,
        storage_provider: 'local',
        object_key: uploadedKey,
        status: 'uploaded',
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete from local storage if DB insert fails
      try {
        await localStorageProvider.deleteFile(uploadedKey);
      } catch (deleteError) {
        console.error('Rollback delete error:', deleteError);
      }
      
      return NextResponse.json(
        { error: 'Failed to save file metadata: ' + dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: fileData,
      message: 'File uploaded successfully to local storage',
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}