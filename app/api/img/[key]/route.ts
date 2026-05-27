/**
 * GET /api/img/:key   返回已转存的分镜图 (永久有效)
 */

import { NextResponse } from 'next/server';
import { getImageBlob } from '@/lib/image-store';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const blob = await getImageBlob(params.key);
  if (!blob) {
    return NextResponse.json({ error: '图片不存在' }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(blob.buffer), {
    status: 200,
    headers: {
      'Content-Type': blob.contentType,
      // 内容不可变, 长缓存
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
