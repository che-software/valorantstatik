/**
 * dotenv — Next.js çoğu zaman .env* dosyalarını kendisi yükler; bu modül
 * açık yükleme ve Node dışı script’ler için aynı davranışı garanti eder.
 * Sadece Node runtime’da import edin (Edge bundle’ına sokmayın).
 */
import { config } from "dotenv";
import { join } from "node:path";

const root = process.cwd();
config({ path: join(root, ".env.local") });
config({ path: join(root, ".env") });

export {};
