import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        
        // Regular client for authentication
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

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Deleting account for user:', user.id);

        // Create ADMIN client with service role key for deletion
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

        // Step 1: Delete files from storage server
        const { data: files } = await supabase
            .from('files')
            .select('object_key')
            .eq('owner_id', user.id);

        if (files && files.length > 0) {
            const STORAGE_SERVER_URL = process.env.STORAGE_SERVER_URL;
            const STORAGE_SERVER_SECRET = process.env.STORAGE_SERVER_SECRET;
            
            if (STORAGE_SERVER_URL && STORAGE_SERVER_SECRET) {
                for (const file of files) {
                    try {
                        await fetch(`${STORAGE_SERVER_URL}/files/${file.object_key}`, {
                            method: 'DELETE',
                            headers: { 'x-storage-secret': STORAGE_SERVER_SECRET }
                        });
                        console.log(`Deleted from storage: ${file.object_key}`);
                    } catch (e) {
                        console.error(`Failed to delete from storage: ${file.object_key}`, e);
                    }
                }
            }
        }

        // Step 2: Delete from all tables (these will cascade with CASCADE set)
        await supabase.from('file_activity_logs').delete().eq('user_id', user.id);
        await supabase.from('file_ai_metadata').delete().eq('owner_id', user.id);
        await supabase.from('files').delete().eq('owner_id', user.id);
        await supabase.from('folders').delete().eq('owner_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);

        console.log('All user data deleted from public tables');

        // Step 3: Delete user from auth.users using ADMIN client
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
            console.error('Error deleting user from auth:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete user account: ' + deleteError.message },
                { status: 500 }
            );
        }

        console.log('User deleted from auth.users successfully');

        // Step 4: Sign out and clear cookies
        await supabase.auth.signOut();

        const response = NextResponse.json({
            success: true,
            message: 'Account deleted successfully'
        });

        // Clear auth cookies
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        
        return response;
        
    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete account' },
            { status: 500 }
        );
    }
}