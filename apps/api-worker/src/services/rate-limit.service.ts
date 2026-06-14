export class RateLimitService {
  constructor(private cache: any) {}

  async isRateLimited(endpointId: string, limit: number): Promise<boolean> {
    if (!this.cache) {
      return false;
    }

    const key = `ratelimit:${endpointId}`;
    const val = await this.cache.get(key);
    const current = val ? parseInt(val, 10) : 0;

    if (current >= limit) {
      return true;
    }

    await this.cache.put(key, (current + 1).toString(), {
      expirationTtl: 60,
    });
    return false;
  }
}
