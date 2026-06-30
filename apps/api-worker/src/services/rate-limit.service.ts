export class RateLimitService {
  constructor(private cache: any) {}

  async isRateLimited(
    key: string,
    limit: number,
    windowSeconds = 60,
  ): Promise<boolean> {
    if (!this.cache) {
      return false;
    }

    const cacheKey = `ratelimit:${key}`;
    const val = await this.cache.get(cacheKey);
    const current = val ? parseInt(val, 10) : 0;

    if (current >= limit) {
      return true;
    }

    await this.cache.put(cacheKey, (current + 1).toString(), {
      expirationTtl: windowSeconds,
    });
    return false;
  }
}
