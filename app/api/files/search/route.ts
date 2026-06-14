import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const folderId = searchParams.get('folderId');

    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: any; value: any; options: any; }[]) {
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

    // Build search query
    let searchQuery = supabase
      .from('files')
      .select(`
        *,
        file_ai_metadata (
          extracted_text,
          manual_tags,
          color_tags
        )
      `)
      .eq('owner_id', user.id)
      .eq('status', 'uploaded');

    // Filter by folder
    if (folderId === 'null' || !folderId) {
      searchQuery = searchQuery.is('folder_id', null);
    } else if (folderId) {
      searchQuery = searchQuery.eq('folder_id', folderId);
    }

    // Apply search if query exists
    if (query && query.trim()) {
      searchQuery = searchQuery.or(
        `file_name.ilike.%${query}%,` +
        `file_ai_metadata.extracted_text.ilike.%${query}%,` +
        `file_ai_metadata.manual_tags.cs.{${query}}`
      );
    }

    const { data: files, error } = await searchQuery.order('created_at', { ascending: false });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files,
      query,
      count: files?.length || 0,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}