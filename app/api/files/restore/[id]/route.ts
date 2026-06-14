import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params to get id (Next.js 16 pattern)
        const { id } = await params;

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

        // Restore file from trash
        const { error } = await supabase
            .from('files')
            .update({ is_trashed: false, trashed_at: null })
            .eq('id', id)
            .eq('owner_id', user.id);

        if (error) throw error;

        // Log activity
        await supabase
            .from('file_activity_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'restore'
            });

        return NextResponse.json({ 
            success: true, 
            message: 'File restored from trash' 
        });
    } catch (error) {
        console.error('Restore API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to restore file' },
            { status: 500 }
        );
    }
}