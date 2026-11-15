export async function authorizeUpload(request: Request, secret?: string): Promise<Response | null> {
  if (!secret || secret.length < 32) {
    return Response.json({ error: 'بارگذاری هنوز توسط مدیر فعال نشده است.' }, { status: 503 });
  }
  const header = request.headers.get('Authorization') || '';
  const candidate = header.startsWith('Bearer ') ? header.slice(7) : '';
  const encoder = new TextEncoder();
  const [expected, supplied] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(secret)),
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
  ]);
  const left = new Uint8Array(expected);
  const right = new Uint8Array(supplied);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference !== 0) {
    return Response.json({ error: 'رمز مدیریت صحیح نیست.' }, { status: 401 });
  }
  return null;
}
