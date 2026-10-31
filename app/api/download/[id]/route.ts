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

    const file = await env.BUCKET.get(r.key);
    if (!file) {
      return new Response('فایل در مخزن پیدا نشد.', { status: 404 });
    }

    const filename = r.filename || 'update-package.bin';
    const encodedFilename = encodeURIComponent(filename);

    return new Response(file.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(file.size),
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطا در دریافت فایل دانلود';
    return new Response(msg, { status: 500 });
  }
}
