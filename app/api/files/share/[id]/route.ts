import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// POST: Share a file with another user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { email, permission } = await request.json();

        if (!email || !permission) {
            return NextResponse.json(
                { error: 'Email and permission are required' },
                { status: 400 }
            );
        }

        if (!['view', 'download'].includes(permission)) {
            return NextResponse.json(
                { error: 'Permission must be either "view" or "download"' },
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

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify user owns the file
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', id)
            .eq('owner_id', user.id)
            .single();

        if (fileError || !file) {
            return NextResponse.json(
                { error: 'File not found or you do not own it' },
                { status: 404 }
            );
        }

        // Find the user to share with
        const { data: sharedUser, error: userFindError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .single();

        if (userFindError || !sharedUser) {
            return NextResponse.json(
                { error: 'User with this email not found' },
                { status: 404 }
            );
        }

        // Prevent sharing with self
        if (sharedUser.id === user.id) {
            return NextResponse.json(
                { error: 'Cannot share file with yourself' },
                { status: 400 }
            );
        }

        // Check if share already exists
        const { data: existingShare, error: existingError } = await supabase
            .from('file_shares')
            .select('*')
            .eq('file_id', id)
            .eq('shared_with_user_id', sharedUser.id)
            .single();

        if (existingShare) {
            // Update existing share
            const { error: updateError } = await supabase
                .from('file_shares')
                .update({ permission })
                .eq('id', existingShare.id);

            if (updateError) {
                return NextResponse.json(
                    { error: 'Failed to update share: ' + updateError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Share updated successfully',
                sharedWith: sharedUser.email,
                permission
            });
        }

        // Create new share
        const { error: shareError } = await supabase
            .from('file_shares')
            .insert({
                file_id: id,
                owner_id: user.id,
                shared_with_user_id: sharedUser.id,
                shared_with_email: sharedUser.email,
                permission
            });

        if (shareError) {
            return NextResponse.json(
                { error: 'Failed to share file: ' + shareError.message },
                { status: 500 }
            );
        }

        // Log activity
        await supabase
            .from('file_activity_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'share'
            });

        return NextResponse.json({
            success: true,
            message: 'File shared successfully',
            sharedWith: sharedUser.email,
            permission
        });
    } catch (error) {
        console.error('Share API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Revoke sharing
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { sharedWithUserId } = await request.json();

        if (!sharedWithUserId) {
            return NextResponse.json(
                { error: 'User ID is required' },
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

        // Delete the share
        const { error: deleteError } = await supabase
            .from('file_shares')
            .delete()
            .eq('file_id', id)
            .eq('owner_id', user.id)
            .eq('shared_with_user_id', sharedWithUserId);

        if (deleteError) {
            return NextResponse.json(
                { error: 'Failed to revoke share: ' + deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Share revoked successfully'
        });
    } catch (error) {
        console.error('Revoke share API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET: Get shares for a file
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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

        const { data: shares, error: sharesError } = await supabase
            .from('file_shares')
            .select('*')
            .eq('file_id', id)
            .eq('owner_id', user.id);

        if (sharesError) {
            return NextResponse.json(
                { error: 'Failed to get shares' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            shares
        });
    } catch (error) {
        console.error('Get shares API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}