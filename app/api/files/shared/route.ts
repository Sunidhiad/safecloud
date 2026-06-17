import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
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

        // Get files shared with the user - using a simpler query
        const { data: shares, error: sharesError } = await supabase
            .from('file_shares')
            .select(`
                id,
                permission,
                created_at,
                shared_with_email,
                file_id,
                owner_id
            `)
            .eq('shared_with_user_id', user.id);

        if (sharesError) {
            console.error('Shares error:', sharesError);
            return NextResponse.json(
                { error: 'Failed to load shares: ' + sharesError.message },
                { status: 500 }
            );
        }

        if (!shares || shares.length === 0) {
            return NextResponse.json({
                success: true,
                files: []
            });
        }

        // Get file details for each share
        const fileIds = shares.map(s => s.file_id);
        const { data: files, error: filesError } = await supabase
            .from('files')
            .select('*')
            .in('id', fileIds);

        if (filesError) {
            console.error('Files error:', filesError);
            return NextResponse.json(
                { error: 'Failed to load file details: ' + filesError.message },
                { status: 500 }
            );
        }

        // Get owner emails
        const ownerIds = shares.map(s => s.owner_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', ownerIds);

        if (profilesError) {
            console.error('Profiles error:', profilesError);
            // Continue without owner emails
        }

        // Create a map of owner emails
        const ownerEmailMap: Record<string, string> = {};
        if (profiles) {
            profiles.forEach(p => {
                ownerEmailMap[p.id] = p.email;
            });
        }

        // Format the response
        const sharedFiles = shares.map(share => {
            const file = files?.find(f => f.id === share.file_id);
            if (!file) return null;
            
            return {
                shareId: share.id,
                fileId: file.id,
                fileName: file.file_name,
                fileType: file.file_type,
                fileSize: file.file_size,
                uploadedAt: file.created_at,
                ownerEmail: ownerEmailMap[share.owner_id] || share.shared_with_email || 'Unknown',
                permission: share.permission,
                sharedAt: share.created_at
            };
        }).filter(Boolean);

        return NextResponse.json({
            success: true,
            files: sharedFiles
        });
    } catch (error) {
        console.error('Shared files API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}