import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { decryptBuffer } from '@/lib/crypto/aes';

export const runtime = 'nodejs';

const STORAGE_SERVER_URL = process.env.STORAGE_SERVER_URL!;
const STORAGE_SERVER_SECRET = process.env.STORAGE_SERVER_SECRET!;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json(
                { error: 'Invalid file ID format' },
                { status: 400 }
            );
        }

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

        // Get file metadata
        const { data: file, error: dbError } = await supabase
            .from('files')
            .select('*')
            .eq('id', id)
            .single();

        if (dbError || !file) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Check if user has access (owner or shared with view/download permission)
        let hasAccess = false;
        let permissionType = '';

        // Check if user is owner
        if (file.owner_id === user.id) {
            hasAccess = true;
            permissionType = 'owner';
        } else {
            // Check if file is shared with user
            const { data: share, error: shareError } = await supabase
                .from('file_shares')
                .select('permission')
                .eq('file_id', id)
                .eq('shared_with_user_id', user.id)
                .single();

            if (!shareError && share) {
                if (share.permission === 'view' || share.permission === 'download') {
                    hasAccess = true;
                    permissionType = share.permission;
                }
            }
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Access denied. You do not have permission to view this file.' },
                { status: 403 }
            );
        }

        // Fetch encrypted file from storage server
        let fetchResponse: Response;
        try {
            fetchResponse = await fetch(`${STORAGE_SERVER_URL}/files/${file.object_key}`, {
                method: 'GET',
                headers: {
                    'x-storage-secret': STORAGE_SERVER_SECRET,
                    'ngrok-skip-browser-warning': 'true',
                }
            });
        } catch (fetchError) {
            console.error('Storage server fetch error:', fetchError);
            return NextResponse.json(
                { error: 'Failed to connect to storage server' },
                { status: 503 }
            );
        }

        if (!fetchResponse.ok) {
            let errorMessage = `Storage server returned status ${fetchResponse.status}`;
            try {
                const text = await fetchResponse.text();
                console.error('Storage server error:', text);
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.error || json.message || errorMessage;
                } catch {
                    errorMessage = text.substring(0, 200);
                }
            } catch (e) {
                // Use default message
            }
            return NextResponse.json(
                { error: errorMessage },
                { status: fetchResponse.status }
            );
        }

        // Get encrypted buffer
        let encryptedBuffer: Buffer;
        try {
            const arrayBuffer = await fetchResponse.arrayBuffer();
            encryptedBuffer = Buffer.from(arrayBuffer);
        } catch (bufferError) {
            console.error('Buffer conversion error:', bufferError);
            return NextResponse.json(
                { error: 'Failed to read file from storage' },
                { status: 500 }
            );
        }

        // Decrypt the file
        let decryptedBuffer: Buffer;
        try {
            decryptedBuffer = await decryptBuffer(
                encryptedBuffer,
                file.encryption_iv,
                file.encryption_auth_tag
            );
        } catch (decryptError) {
            console.error('Decryption error:', decryptError);
            return NextResponse.json(
                { error: 'Failed to decrypt file' },
                { status: 500 }
            );
        }

        // Log view activity (only if user is not the owner)
        try {
            if (file.owner_id !== user.id) {
                await supabase
                    .from('file_activity_logs')
                    .insert({
                        file_id: id,
                        user_id: user.id,
                        action: 'view_shared'
                    });
            }
        } catch (logError) {
            console.warn('Failed to log activity:', logError);
            // Don't fail the request for logging errors
        }

        // Determine if inline display is possible
        const isImage = file.file_type?.startsWith('image/') || false;
        const isPdf = file.file_type === 'application/pdf';
        const isVideo = file.file_type?.startsWith('video/') || false;
        const isAudio = file.file_type?.startsWith('audio/') || false;
        
        const inlineTypes = isImage || isPdf || isVideo || isAudio;
        const disposition = inlineTypes ? 'inline' : 'attachment';

        // Return the decrypted file
        return new NextResponse(new Uint8Array(decryptedBuffer), {
            status: 200,
            headers: {
                'Content-Type': file.file_type || 'application/octet-stream',
                'Content-Disposition': `${disposition}; filename="${encodeURIComponent(file.file_name)}"`,
                'Cache-Control': 'public, max-age=31536000',
                'Content-Length': decryptedBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('View API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}