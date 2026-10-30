import {env} from 'cloudflare:workers';
import {getDb} from '@/db';
import {releases} from '@/db/schema';
import {eq} from 'drizzle-orm';
export async function GET(req:Request,context:{params:Promise<{id:string}>}){const {id}=await context.params;const [r]=await getDb().select().from(releases).where(eq(releases.id,id));if(!r)return new Response('فایل پیدا نشد',{status:404});if(r.url)return Response.redirect(r.url,302);const file=await env.BUCKET!.get(r.key!);if(!file)return new Response('فایل پیدا نشد',{status:404});return new Response(file.body,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(file.size),'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(r.filename||'update.zip'),'X-Content-Type-Options':'nosniff'}})}
