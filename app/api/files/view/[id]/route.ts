import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Authenticate user
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            return (await cookieStore).getAll();
          },
          setAll(cookiesToSet: { name: any; value: any; options: any; }[]) {
            try {
              cookiesToSet.forEach(async ({ name, value, options }) =>
                (await cookieStore).set(name, value, options)
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

    // Get file metadata
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

    // Log activity
    await supabase
      .from('file_activity_logs')
      .insert({
        file_id: id,
        user_id: user.id,
        action: 'view'
      });

    // Read file from local storage
    const filePath = path.join(process.cwd(), 'uploads', file.object_key);
    const fileBuffer = await fs.readFile(filePath);

    // Determine if it's an image for inline display
    const isImage = file.file_type.startsWith('image/');
    const disposition = isImage ? 'inline' : 'attachment';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.file_type,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(file.file_name)}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('View API error:', error);
    return NextResponse.json(
      { error: 'Failed to view file' },
      { status: 500 }
    );
  }
}