import { env } from 'cloudflare:workers';
import { getDb } from '@/db';
import { releases } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const [r] = await getDb().select().from(releases).where(eq(releases.id, id));

    if (!r) {
      return new Response('فایل یا نسخه مورد نظر یافت نشد.', { status: 404 });
    }

    // اگر لینک خارجی باشد، هدایت مستقیم انجام می‌شود
    if (r.url) {
      return Response.redirect(r.url, 302);
    }

    if (!r.key || !env.BUCKET) {
      return new Response('مخزن ذخیره‌سازی فایل در دسترس نیست.', { status: 503 });
    }

    let file;
    const rangeHeader = _req.headers.get('range');
    try {
      file = await env.BUCKET.get(r.key, rangeHeader ? { range: _req.headers } : {});
    } catch {
      file = await env.BUCKET.get(r.key);
    }
    if (!file) {
      return new Response('فایل در مخزن پیدا نشد.', { status: 404 });
    }

    const filename = r.filename || 'update-package.bin';
    const encodedFilename = encodeURIComponent(filename);

    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`,
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=604800',
    };

    if ('range' in file && file.range) {
      const rObj = file.range as { offset: number; length: number };
      const total = ('size' in file ? (file as unknown as { size: number }).size : rObj.length);
      headers['Content-Range'] = `bytes ${rObj.offset}-${rObj.offset + rObj.length - 1}/${total}`;
      headers['Content-Length'] = String(rObj.length);
      return new Response(file.body, { status: 206, headers });
    }

    headers['Content-Length'] = String(file.size);
    return new Response(file.body, { status: 200, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطا در دریافت فایل دانلود';
    return new Response(msg, { status: 500 });
  }
}
