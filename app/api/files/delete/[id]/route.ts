import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const STORAGE_SERVER_URL = process.env.STORAGE_SERVER_URL!;
const STORAGE_SERVER_SECRET = process.env.STORAGE_SERVER_SECRET!;

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params to get id (Next.js 16 pattern)
        const { id } = await params;

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

        // 2. Get file metadata
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

        // 3. Delete from storage server (optional - you can keep or remove)
        let storageDeleteSuccess = false;
        try {
            const deleteResponse = await fetch(`${STORAGE_SERVER_URL}/files/${file.object_key}`, {
                method: 'DELETE',
                headers: {
                    'x-storage-secret': STORAGE_SERVER_SECRET
                }
            });
            
            if (deleteResponse.ok) {
                storageDeleteSuccess = true;
            }
        } catch (deleteError) {
            console.error('Storage server delete error:', deleteError);
            // Don't fail the request - file might already be deleted
        }

        // 4. Move to trash in Supabase (not permanent delete)
        const { error: updateError } = await supabase
            .from('files')
            .update({ 
                is_trashed: true, 
                trashed_at: new Date().toISOString() 
            })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to move file to trash: ' + updateError.message },
                { status: 500 }
            );
        }

        // 5. Log activity
        await supabase
            .from('file_activity_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'trash'
            });

        return NextResponse.json({
            success: true,
            message: 'File moved to trash',
        });
    } catch (error) {
        console.error('Delete API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}