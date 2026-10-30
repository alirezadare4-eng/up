import {env} from 'cloudflare:workers';
import {getDb} from '@/db';
import {releases} from '@/db/schema';
import {desc} from 'drizzle-orm';
export async function GET(){return Response.json(await getDb().select().from(releases).orderBy(desc(releases.created)))}
export async function POST(req:Request){
 if(!req.headers.get('oai-authenticated-user-id'))return Response.json({error:'برای ثبت آپدیت وارد حساب شوید.'},{status:401});
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return new Response('Forbidden',{status:403});
 try{const f=await req.formData(),category=String(f.get('category')||''),title=String(f.get('title')||'').trim(),version=String(f.get('version')||'').trim(),notes=String(f.get('notes')||'');
 if(!['بازرگانی','صنعتی','رستورانی','باشگاه مشتریان','دیجی کالا','اسنپ','پوز اندروید','ریپلیکیشن','اعتباری'].includes(category)||!title||title.length>120||!version||version.length>40||notes.length>4000)throw Error('اطلاعات نسخه معتبر نیست.');
 const id=crypto.randomUUID();let url:string|null=null,key:string|null=null,filename:string|null=null;
 if(f.get('mode')==='link'){const u=new URL(String(f.get('url')));if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('لینک معتبر HTTP یا HTTPS وارد کنید.');url=u.href;}else{const file=f.get('file');if(!(file instanceof File)||!file.size||file.size>50*1024*1024||!(/\.(zip|rar)$/i.test(file.name)))throw Error('فایل ZIP یا RAR با حجم حداکثر ۵۰ مگابایت انتخاب کنید.');const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());if(!(bytes[0]===80&&bytes[1]===75)&&!(bytes[0]===82&&bytes[1]===97&&bytes[2]===114&&bytes[3]===33))throw Error('محتوای فایل فشرده معتبر نیست.');key='releases/'+id;filename=file.name;await env.BUCKET!.put(key,file.stream(),{httpMetadata:{contentType:'application/octet-stream'}});}
 try{await getDb().insert(releases).values({id,category,title,version,notes,url,key,filename,created:Date.now()})}catch(e){if(key)await env.BUCKET!.delete(key);throw e}return Response.json({id},{status:201});
 }catch(e:any){return Response.json({error:e.message||'ثبت آپدیت انجام نشد.'},{status:400})}}
