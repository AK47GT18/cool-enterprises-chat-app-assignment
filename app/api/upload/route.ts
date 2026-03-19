import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { SessionService } from '@/services/session.service';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await SessionService.requireAuth();
    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if dir already exists
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[UPLOAD_POST]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
