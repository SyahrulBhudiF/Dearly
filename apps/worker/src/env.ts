export interface DearlyEnv {
  readonly [key: string]: unknown;
  readonly ASSETS?: Fetcher;
  readonly DB?: D1Database;
  readonly MEDIA?: R2Bucket;
}
