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
        // Await params to get id (Next.js 16 pattern)
        const { id } = await params;

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
            .eq('owner_id', user.id)
            .single();

        if (dbError || !file) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Fetch encrypted file from storage server
        const fetchResponse = await fetch(`${STORAGE_SERVER_URL}/files/${file.object_key}`, {
            method: 'GET',
            headers: {
                'x-storage-secret': STORAGE_SERVER_SECRET
            }
        });

        if (!fetchResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch file from storage server' },
                { status: 500 }
            );
        }

        // Get encrypted buffer
        const encryptedBuffer = Buffer.from(await fetchResponse.arrayBuffer());

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

        // Log view activity
        await supabase
            .from('file_activity_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'view'
            });

        // Determine if inline display is possible
        const isImage = file.file_type.startsWith('image/');
        const isPdf = file.file_type === 'application/pdf';
        const isVideo = file.file_type.startsWith('video/');
        const isAudio = file.file_type.startsWith('audio/');
        
        const inlineTypes = isImage || isPdf || isVideo || isAudio;
        const disposition = inlineTypes ? 'inline' : 'attachment';

        // Convert Node Buffer to Uint8Array for NextResponse body to satisfy typings
        const responseBody = new Uint8Array(decryptedBuffer);

        return new NextResponse(responseBody, {
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