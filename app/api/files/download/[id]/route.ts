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

        // 2. Get file metadata from Supabase
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

        // 3. Fetch encrypted file from storage server
        const fetchResponse = await fetch(`${STORAGE_SERVER_URL}/files/${file.object_key}`, {
            method: 'GET',
            headers: {
                'x-storage-secret': STORAGE_SERVER_SECRET
            }
        });

        if (!fetchResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch encrypted file from storage server' },
                { status: 500 }
            );
        }

        // 4. Get encrypted buffer
        const encryptedBuffer = Buffer.from(await fetchResponse.arrayBuffer());

        // 5. Decrypt the file
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

        // 6. Log download activity
        await supabase
            .from('file_activity_logs')
            .insert({
                file_id: id,
                user_id: user.id,
                action: 'download'
            });

        // 7. Return decrypted file
        const encodedFileName = encodeURIComponent(file.file_name);

        // Convert Node Buffer to Uint8Array for Response body compatibility
        const body = new Uint8Array(decryptedBuffer);

        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': file.file_type,
                'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
                'Content-Length': body.byteLength.toString(),
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Download API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}