import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SessionService } from '@/services/session.service';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = `${user.id}/${fileName}`; // organise by user

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[UPLOAD_POST] Supabase error:', uploadError);
      return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
    }

    const { data } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('[UPLOAD_POST]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}