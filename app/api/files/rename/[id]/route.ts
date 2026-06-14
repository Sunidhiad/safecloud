import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { newFileName } = await request.json();

        if (!newFileName || !newFileName.trim()) {
            return NextResponse.json(
                { error: 'File name is required' },
                { status: 400 }
            );
        }

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

        // Verify file ownership
        const { data: existingFile, error: findError } = await supabase
            .from('files')
            .select('id')
            .eq('id', id)
            .eq('owner_id', user.id)
            .single();

        if (findError || !existingFile) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Update only the file_name, keep object_key unchanged
        const { error } = await supabase
            .from('files')
            .update({ file_name: newFileName.trim() })
            .eq('id', id)
            .eq('owner_id', user.id);

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            message: 'File renamed successfully' 
        });
    } catch (error) {
        console.error('Rename API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to rename file' },
            { status: 500 }
        );
    }
}