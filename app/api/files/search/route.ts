import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const folderId = searchParams.get('folderId');
        const includeTrash = searchParams.get('includeTrash') === 'true';

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

        // Start building the query
        let filesQuery = supabase
            .from('files')
            .select('*')
            .eq('owner_id', user.id);

        // Filter by trash status
        if (includeTrash) {
            filesQuery = filesQuery.eq('is_trashed', true);
        } else {
            filesQuery = filesQuery.eq('is_trashed', false);
        }

        // Filter by folder if provided
        if (folderId && folderId !== 'null') {
            filesQuery = filesQuery.eq('folder_id', folderId);
        } else if (folderId === 'null' || !folderId) {
            filesQuery = filesQuery.is('folder_id', null);
        }

        // Apply search if query exists
        if (query && query.trim()) {
            const searchTerm = `%${query.trim()}%`;
            filesQuery = filesQuery.or(
                `file_name.ilike.${searchTerm},` +
                `file_type.ilike.${searchTerm}`
            );
        }

        // Order by most recent first
        const { data: files, error: filesError } = await filesQuery
            .order('created_at', { ascending: false });

        if (filesError) {
            console.error('Search error:', filesError);
            return NextResponse.json(
                { error: 'Search failed: ' + filesError.message },
                { status: 500 }
            );
        }

        // Get folder names for files that have folder_id
        const folderIds = files
            ?.filter(f => f.folder_id)
            .map(f => f.folder_id) || [];

        let folderMap: Record<string, string> = {};
        if (folderIds.length > 0) {
            const { data: folders, error: foldersError } = await supabase
                .from('folders')
                .select('id, name')
                .in('id', folderIds);

            if (!foldersError && folders) {
                folderMap = folders.reduce((acc, folder) => {
                    acc[folder.id] = folder.name;
                    return acc;
                }, {} as Record<string, string>);
            }
        }

        // Add folder names to files
        const filesWithFolderNames = files?.map(file => ({
            ...file,
            folder_name: file.folder_id ? folderMap[file.folder_id] || null : null
        })) || [];

        return NextResponse.json({
            success: true,
            files: filesWithFolderNames,
            query: query.trim(),
            count: filesWithFolderNames.length
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}