import { createHealthCheckHandler } from '@/lib/db/health-check';

const healthCheck = createHealthCheckHandler();

export async function GET() {
  return await healthCheck();
}