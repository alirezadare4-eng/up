declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    UP_ADMIN_TOKEN?: string;
  }
}
