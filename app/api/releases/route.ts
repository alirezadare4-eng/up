import { env } from 'cloudflare:workers';
import { getDb } from '@/db';
import { releases } from '@/db/schema';
import { desc } from 'drizzle-orm';

const VALID_CATEGORIES = [
  'بازرگانی',
  'صنعتی',
  'رستورانی',
  'باشگاه مشتریان',
  'دیجی کالا',
  'اسنپ',
  'پوز اندروید',
  'ریپلیکیشن',
  'اعتباری',
  'عمومی',
];

export async function GET() {
  try {
    const list = await getDb().select().from(releases).orderBy(desc(releases.created));
    return Response.json(list);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'خطا در دریافت لیست نسخه‌ها';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const mode = String(formData.get('mode') || 'file');
    let category = String(formData.get('category') || '').trim();
    let title = String(formData.get('title') || '').trim();
    let version = String(formData.get('version') || '').trim();
    const notes = String(formData.get('notes') || '').trim();

    if (!category || !VALID_CATEGORIES.includes(category)) {
      category = 'بازرگانی';
    }

    const id = crypto.randomUUID();
    let url: string | null = null;
    let key: string | null = null;
    let filename: string | null = null;

    if (mode === 'link') {
      const rawUrl = String(formData.get('url') || '').trim();
      if (!rawUrl) {
        throw new Error('لطفاً آدرس اینترنتی دانلود را وارد نمایید.');
      }
      const parsedUrl = new URL(rawUrl);
      if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        throw new Error('لینک وارد شده باید با http یا https آغاز شود.');
      }
      url = parsedUrl.href;
      if (!title) {
        title = `لینک دانلود نسخه ${version || 'جدید'}`;
      }
      if (!version) {
        version = '1.0.0';
      }
    } else {
      // حالت آپلود فایل و ساخت لینک دانلود مستقیم
      const file = formData.get('file');
      if (!(file instanceof File) || !file.size) {
        throw new Error('لطفاً یک فایل معتبر برای آپلود و ساخت لینک انتخاب کنید.');
      }

      const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
      if (file.size > MAX_SIZE) {
        throw new Error('حجم فایل انتخابی بیشتر از سقف مجاز (۱۰۰ مگابایت) است.');
      }

      filename = file.name;

      // تشخیص خودکار عنوان در صورت خالی بودن
      if (!title) {
        const baseName = filename.replace(/\.[^/.]+$/, '');
        title = baseName.replace(/[_-]+/g, ' ').trim() || 'فایل به‌روزرسانی';
      }

      // تشخیص خودکار نسخه از روی نام فایل در صورت خالی بودن
      if (!version) {
        const vMatch = filename.match(/[vV]?(\d+(\.\d+)+)/) || filename.match(/(14\d{2})/);
        version = vMatch ? vMatch[1] : '1.0.0';
      }

      // ذخیره‌سازی فایل در مخزن ابری
      key = `releases/${id}/${encodeURIComponent(filename)}`;
      if (env.BUCKET) {
        await env.BUCKET.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type || 'application/octet-stream',
          },
        });
      }
    }

    if (title.length > 120) {
      title = title.substring(0, 120);
    }
    if (version.length > 40) {
      version = version.substring(0, 40);
    }

    try {
      await getDb().insert(releases).values({
        id,
        category,
        title,
        version,
        notes,
        url,
        key,
        filename,
        created: Date.now(),
      });
    } catch (dbErr: unknown) {
      if (key && env.BUCKET) {
        try {
          await env.BUCKET.delete(key);
        } catch {
          // ignore rollback cleanup errors
        }
      }
      throw dbErr;
    }

    const downloadPath = `/api/download/${id}`;

    return Response.json(
      {
        id,
        downloadUrl: downloadPath,
        filename,
        title,
        version,
        category,
        message: 'فایل با موفقیت ثبت شد و لینک مستقیم دانلود ایجاد گردید.',
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'ثبت فایل و ساخت لینک انجام نشد.';
    return Response.json({ error: message }, { status: 400 });
  }
}
