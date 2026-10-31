"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Plus,
  Search,
  X,
  Link2,
  Upload,
  FileArchive,

  Check,
  ChevronLeft,
  FolderOpen,
  LoaderCircle,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const categories = [
  'بازرگانی',
  'صنعتی',
  'رستورانی',
  'باشگاه مشتریان',
  'دیجی کالا',
  'اسنپ',
  'پوز اندروید',
  'ریپلیکیشن',
  'اعتباری',
];

type Release = {
  id: string;
  title: string;
  category: string;
  version: string;
  notes: string;
  url: string | null;
  filename: string | null;
  created: number;
};

type GeneratedLinkInfo = {
  id: string;
  url: string;
  filename: string;
  title: string;
  version: string;
  size?: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Page() {
  const [items, setItems] = useState<Release[]>([]);
  const [cat, setCat] = useState('همه برنامه‌ها');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filename, setFilename] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]);
  const [formNotes, setFormNotes] = useState('');
  const [copied, setCopied] = useState('');
  const [generatedLink, setGeneratedLink] = useState<GeneratedLinkInfo | null>(null);

  const dialog = useRef<HTMLDialogElement>(null);
  const resultDialog = useRef<HTMLDialogElement>(null);

  const loadReleases = useCallback(() => {
    fetch('/api/releases')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setItems(data as Release[]);
        setLoading(false);
      })
      .catch(() => {
        setError('دریافت اطلاعات انجام نشد. دوباره تلاش کنید.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch('/api/releases')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setItems(data as Release[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('دریافت اطلاعات انجام نشد. دوباره تلاش کنید.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);

  useEffect(() => {
    if (resultModal) resultDialog.current?.showModal();
    else resultDialog.current?.close();
  }, [resultModal]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  function openUploadModal() {
    setError('');
    setFilename('');
    setFileSizeStr('');
    setFormTitle('');
    setFormVersion('');
    setFormNotes('');
    setMode('file');
    setModal(true);
  }

  function handleFileSelected(file: File) {
    setFilename(file.name);
    setFileSizeStr(formatBytes(file.size));

    // استخراج هوشمند عنوان و شماره نسخه از روی نام فایل
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const cleanTitle = baseName.replace(/[_-]+/g, ' ').trim();
    if (!formTitle) {
      setFormTitle(cleanTitle || 'فایل آپدیت');
    }

    const vMatch = file.name.match(/[vV]?(\d+(\.\d+)+)/) || file.name.match(/(14\d{2})/);
    if (!formVersion && vMatch) {
      setFormVersion(vMatch[1]);
    } else if (!formVersion) {
      setFormVersion('1.0.0');
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const data = new FormData();
      data.set('mode', mode);
      data.set('category', formCategory);
      data.set('title', formTitle.trim());
      data.set('version', formVersion.trim() || '1.0.0');
      data.set('notes', formNotes.trim());

      if (mode === 'file') {
        const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        if (!file) throw new Error('لطفاً فایلی را برای آپلود انتخاب کنید.');
        if (file.size > 100 * 1024 * 1024) throw new Error('حجم فایل باید کمتر از ۱۰۰ مگابایت باشد.');
        data.set('file', file);
      } else {
        const urlInput = e.currentTarget.querySelector('input[name="url"]') as HTMLInputElement;
        const urlVal = urlInput?.value?.trim() || '';
        if (!urlVal) throw new Error('آدرس دانلود اینترنتی را وارد کنید.');
        data.set('url', urlVal);
      }

      const r = await fetch('/api/releases', { method: 'POST', body: data });
      const result = (await r.json()) as {
        id?: string;
        downloadUrl?: string;
        filename?: string;
        title?: string;
        version?: string;
        error?: string;
      };

      if (!r.ok || !result.id) {
        throw new Error(result.error || 'ثبت آپدیت انجام نشد.');
      }

      const fullUrl = `${window.location.origin}/api/download/${result.id}`;
      setGeneratedLink({
        id: result.id,
        url: fullUrl,
        filename: result.filename || filename || 'فایل آپدیت',
        title: result.title || formTitle || 'نسخه جدید',
        version: result.version || formVersion || '1.0.0',
        size: fileSizeStr,
      });

      // بستن فرم و نمایش پنجره لینک ایجادشده
      setModal(false);
      setResultModal(true);
      setMessage('فایل دریافت شد و لینک دانلود اختصاصی ساخته شد.');
      loadReleases();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ثبت انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setMessage('لینک دانلود با موفقیت در کلیپ‌بورد کپی شد.');
      setTimeout(() => setCopied(''), 3000);
    } catch {
      setMessage('خطا در کپی خودکار؛ لطفاً آدرس را دستی کپی نمایید.');
    }
  }

  const filtered = items.filter(
    (x) =>
      (cat === 'همه برنامه‌ها' || x.category === cat) &&
      `${x.title} ${x.version} ${x.category}`.includes(q.trim())
  );

  return (
    <>
      <header className="topbar">
        <div className="topinner">
          <Link className="brand" href="/" aria-label="خانه سپهریار">
            <span className="brandmark">
              <img src="/sepehryar-logo.png" alt="" width={40} height={40} />
            </span>
            <strong>
              سپهریار
              <span className="branddivider" />
              <small>مرکز آپدیت و ساخت لینک دانلود</small>
            </strong>
          </Link>
          <span className="topmeta">
            <i /> سامانه ابری مدیریت و تولید لینک مستقیم نسخه‌ها
          </span>
        </div>
      </header>

      <main>
        <section className="intro">
          <div className="hero-emblem" aria-hidden="true"><div className="green-aura" /><img src="/sepehryar-logo.png" alt="" width={140} height={140} /></div>
          <div className="introcopy">
            <div className="eyebrow">SEPEHRYAR / DIRECT DOWNLOAD & RELEASES</div>
            <h1>فایل را بدهید، لینک دانلود مستقیم تحویل بگیرید.</h1>
            <p>
              مرکز ساخت آنی لینک دانلود و آرشیو هوشمند پکیج‌های نصاب و به‌روزرسانی سپهریار.
            </p>
          </div>
          <button className="primary" onClick={openUploadModal}>
            <Plus size={17} /> بارگذاری و ساخت لینک جدید
          </button>
        </section>

        {/* جعبه آپلود سریع در صفحه اصلی */}
        <div className="quickdropzone" onClick={openUploadModal}>
          <div className="quickdropcontent">
            <div className="quickdropicon">
              <Upload size={24} strokeWidth={1.8} />
            </div>
            <div className="quickdroptxt">
              <h3>برای دریافت آنی لینک دانلود، فایل خود را اینجا کلیک یا رها کنید</h3>
              <p>پشتیبانی از انواع فایل‌های ZIP، RAR، EXE، MSI تا ۱۰۰ مگابایت — ساخت خودکار لینک پایدار</p>
            </div>
          </div>
          <button type="button" className="secondary" style={{ pointerEvents: 'none' }}>
            <Sparkles size={15} color="#7361cb" /> انتخاب فایل و تولید لینک
          </button>
        </div>

        <div className="summary">
          <span>
            <b>۹</b> برنامه تحت پوشش
          </span>
          <span className="dot" />
          <span>
            <b>{items.length.toLocaleString('fa-IR')}</b> نسخه و فایل ثبت‌شده
          </span>
          <span className="dot" />
          <span>تولید لینک مستقیم بدون وقفه</span>
        </div>

        <section className="library">
          <div className="libraryhead">
            <div>
              <h2>کتابخانه فایل‌ها و لینک‌ها</h2>
              <span className="count">{filtered.length.toLocaleString('fa-IR')}</span>
            </div>
            <label className="search">
              <Search size={17} />
              <input
                aria-label="جست‌وجوی آپدیت‌ها"
                placeholder="جست‌وجوی نام، فایل یا نسخه…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button aria-label="پاک کردن جست‌وجو" onClick={() => setQ('')}>
                  <X size={14} />
                </button>
              )}
            </label>
          </div>

          <nav className="filters" aria-label="انتخاب برنامه">
            {['همه برنامه‌ها', ...categories].map((c) => (
              <button
                key={c}
                className={cat === c ? 'selected' : ''}
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </nav>

          {error && !modal && (
            <div className="error" role="alert">
              {error}
              <button onClick={loadReleases}>تلاش دوباره</button>
            </div>
          )}

          <div className="tableheading">
            <span>نام، نسخه و فایل</span>
            <span>دسته‌بندی</span>
            <span>تاریخ ثبت</span>
            <span>دریافت و کپی لینک</span>
          </div>

          {loading ? (
            <div className="empty">
              <LoaderCircle className="spin" size={28} />
              <p>در حال دریافت اطلاعات…</p>
            </div>
          ) : filtered.length ? (
            <div className="releases">
              {filtered.map((x) => {
                const directUrl =
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/api/download/${x.id}`
                    : `/api/download/${x.id}`;

                return (
                  <article className="release" key={x.id}>
                    <div className="releaseinfo">
                      <span className="fileicon">
                        {x.url ? <Link2 size={20} /> : <FileArchive size={20} />}
                      </span>
                      <div>
                        <h3>{x.title}</h3>
                        <div className="releaseversion">
                          <span dir="ltr">v{x.version}</span>
                          <span>·</span>
                          <span>
                            {x.url
                              ? 'لینک خارجی'
                              : x.filename || 'فایل مستقیم'}
                          </span>
                        </div>
                        {x.notes && (
                          <details>
                            <summary>توضیحات و تغییرات</summary>
                            <p>{x.notes}</p>
                          </details>
                        )}
                      </div>
                    </div>

                    <span className="category">{x.category}</span>
                    <time dateTime={new Date(x.created).toISOString()}>
                      {new Date(x.created).toLocaleDateString('fa-IR')}
                    </time>

                    <div className="actions">
                      <button
                        className="copylinkbtn"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        title="کپی لینک مستقیم دانلود"
                        onClick={() => copyToClipboard(directUrl, x.id)}
                      >
                        {copied === x.id ? (
                          <>
                            <Check size={14} /> کپی شد
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> کپی لینک
                          </>
                        )}
                      </button>

                      <a
                        className="download"
                        href={'/api/download/' + x.id}
                        target="_blank"
                        rel="noreferrer"
                        title="دانلود مستقیم"
                      >
                        دانلود {x.url ? <ArrowUpRight size={15} /> : <ArrowDownToLine size={15} />}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <div className="emptyvisual">
                <span className="ghostsheet" />
                <span className="emptysheet">
                  <FolderOpen size={28} strokeWidth={1.3} />
                  <i />
                  <i />
                </span>
              </div>
              <h3>
                {q
                  ? 'فایلی با این مشخصات پیدا نشد'
                  : cat === 'همه برنامه‌ها'
                  ? 'اولین فایل را بارگذاری و لینکش را بسازید'
                  : 'هنوز فایلی در این دسته‌بندی ثبت نشده است'}
              </h3>
              <p>
                {q
                  ? 'عبارت جست‌وجو را تغییر دهید.'
                  : 'فایل آپدیت (ZIP، EXE، RAR و...) یا لینک آن را ثبت کنید؛ لینک پایدار و آماده بلافاصله تولید می‌شود.'}
              </p>
              {q ? (
                <button
                  className="textbutton"
                  onClick={() => {
                    setQ('');
                    setCat('همه برنامه‌ها');
                  }}
                >
                  پاک کردن فیلترها <X size={14} />
                </button>
              ) : (
                <button className="secondary" onClick={openUploadModal}>
                  <Plus size={16} /> ثبت فایل و ساخت لینک
                </button>
              )}
              <div className="supported">ZIP · RAR · EXE · MSI · LINK</div>
            </div>
          )}

          <div className="libraryfoot">
            <span>{cat === 'همه برنامه‌ها' ? 'تمام دسته‌بندی‌ها' : cat}</span>
            <span>
              جدیدترین لینک‌ها در ابتدا <ChevronLeft size={12} />
            </span>
          </div>
        </section>

        <footer>
          <span>
            سپهریار <span className="footerline">/</span> سامانه توزیع و مدیریت فایل‌های به‌روزرسانی
          </span>
          <span className="footerenglish">SEPEHRYAR RELEASE & DOWNLOAD CENTER</span>
        </footer>
      </main>

      {message && (
        <div className="toast" role="status">
          <Check size={17} />
          {message}
        </div>
      )}

      {/* مدال بارگذاری فایل و ایجاد لینک */}
      <dialog
        ref={dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setModal(false);
        }}
        onClose={() => setModal(false)}
      >
        <div className="dialogtop">
          <span className="dialogicon">
            <Upload size={20} />
          </span>
          <button
            className="iconbutton"
            aria-label="بستن"
            disabled={busy}
            onClick={() => setModal(false)}
          >
            <X size={19} />
          </button>
        </div>

        <h2>بارگذاری فایل و ساخت لینک</h2>
        <p className="dialoghint">
          فایل را انتخاب نمایید تا بلافاصله لینک دانلود مستقیم و ماندگار تولید شود.
        </p>

        {modal && (
          <form onSubmit={save}>
            <div className="modetabs">
              <button
                type="button"
                className={mode === 'file' ? 'selected' : ''}
                onClick={() => setMode('file')}
              >
                <Upload size={16} /> بارگذاری مستقیم فایل (EXE, ZIP, RAR)
              </button>
              <button
                type="button"
                className={mode === 'link' ? 'selected' : ''}
                onClick={() => setMode('link')}
              >
                <Link2 size={16} /> لینک اینترنتی دانلود
              </button>
            </div>

            {mode === 'file' ? (
              <label className="uploadzone">
                <Upload size={26} strokeWidth={1.5} />
                <strong>{filename || 'کلیک کنید یا فایل را اینجا بکشید و رها کنید'}</strong>
                <span>
                  {fileSizeStr
                    ? `حجم فایل: ${fileSizeStr}`
                    : 'فرمت‌های مجاز: ZIP, RAR, EXE, MSI · حداکثر ۱۰۰ مگابایت'}
                </span>
                <input
                  aria-label="انتخاب فایل"
                  type="file"
                  required={!filename}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                />
              </label>
            ) : (
              <label>
                آدرس مستقیم فایل (URL)
                <input
                  name="url"
                  type="url"
                  dir="ltr"
                  required
                  placeholder="https://example.com/downloads/setup.exe"
                />
              </label>
            )}

            <div className="fields">
              <label>
                برنامه و سیستم
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label>
                شماره نسخه
                <input
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  maxLength={40}
                  placeholder="14.0.0"
                  dir="ltr"
                />
              </label>
            </div>

            <label>
              عنوان یا نام فایل
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={120}
                placeholder="مثلاً آپدیت جامع حسابداری سپهریار"
              />
            </label>

            <label>
              توضیحات یا لاگ تغییرات <small>اختیاری</small>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                maxLength={4000}
                rows={3}
                placeholder="امکانات یا اصلاحیه‌های اضافه شده در این نسخه..."
              />
            </label>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <div className="dialogfooter">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setModal(false)}
              >
                انصراف
              </button>
              <button className="primary" disabled={busy}>
                {busy ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
                {busy ? 'در حال ارسال و تولید لینک…' : 'بارگذاری و ساخت لینک دانلود'}
              </button>
            </div>
          </form>
        )}
      </dialog>

      {/* مدال نتیجه نهایی: لینک ساخته شد */}
      <dialog
        ref={resultDialog}
        className="resultdialog"
        onClose={() => setResultModal(false)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="resultsuccessicon">
            <Check size={28} strokeWidth={2.4} />
          </div>
          <button
            className="iconbutton"
            aria-label="بستن"
            onClick={() => setResultModal(false)}
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="resulttitle">لینک دانلود اختصاصی آماده شد!</h2>
        <p className="resultsub">
          فایل شما با موفقیت ذخیره شد و لینک دانلود پایدار زیر برای استفاده و اشتراک‌گذاری ایجاد گردید:
        </p>

        {generatedLink && (
          <>
            <div className="metafileinfo">
              <FileArchive size={20} color="#7361cb" />
              <div>
                <b>{generatedLink.title}</b>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  نام فایل: {generatedLink.filename} · نسخه: {generatedLink.version}
                  {generatedLink.size && ` · ${generatedLink.size}`}
                </div>
              </div>
            </div>

            <div className="linkbox">
              <input
                className="linkinput"
                readOnly
                value={generatedLink.url}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className={`copylinkbtn ${copied === 'generated' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(generatedLink.url, 'generated')}
              >
                {copied === 'generated' ? (
                  <>
                    <Check size={15} /> کپی شد!
                  </>
                ) : (
                  <>
                    <Copy size={15} /> کپی لینک دانلود
                  </>
                )}
              </button>
            </div>

            <div className="actionrow">
              <a
                className="download"
                href={generatedLink.url}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '9px 16px', fontSize: '12px' }}
              >
                <ExternalLink size={15} /> تست و دانلود مستقیم
              </a>

              <button
                className="primary"
                onClick={() => setResultModal(false)}
                style={{ padding: '9px 20px' }}
              >
                متوجه شدم / بستن
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
