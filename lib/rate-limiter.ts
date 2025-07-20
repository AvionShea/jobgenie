interface RateLimitEntry {
  count: number;
  dailyCount: number;
  lastReset: number;
  dailyReset: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private readonly maxPerMinute = 5;
  private readonly maxPerDay = 10;

  isAllowed(identifier: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const minuteWindow = 60 * 1000;
    const dayWindow = 24 * 60 * 60 * 1000;

    const entry = this.requests.get(identifier) || {
      count: 0,
      dailyCount: 0,
      lastReset: now,
      dailyReset: now,
    };

    //reset minute count if time passed
    if (now - entry.lastReset > minuteWindow) {
      entry.count = 0;
      entry.lastReset = now;
    }

    //resets daily count if time passed
    if (now - entry.dailyReset > dayWindow) {
      entry.dailyCount = 0;
      entry.dailyReset = now;
    }
    //check daily limit first
    if (entry.dailyCount >= this.maxPerDay) {
      return {
        allowed: false,
        message: `Daily limit of ${this.maxPerDay} requests exceeded. Try again tomorrow.`,
      };
    }
    //Check minute limit
    if (entry.count >= this.maxPerMinute) {
      const resetIn = Math.ceil(
        (minuteWindow - (now - entry.lastReset)) / 1000
      );
      return {
        allowed: false,
        message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
      };
    }
    //Increase counters
    entry.count++;
    entry.dailyCount++;
    this.requests.set(identifier, entry);

    return { allowed: true };
  }

  getStatus(identifier: string): { remaining: number; dailyRemaining: number } {
    const entry = this.requests.get(identifier);
    if (!entry) {
      return { remaining: this.maxPerMinute, dailyRemaining: this.maxPerDay };
    }
    return {
      remaining: Math.max(0, this.maxPerMinute - entry.count),
      dailyRemaining: Math.max(0, this.maxPerDay - entry.dailyCount),
    };
  }
}

export const rateLimiter = new RateLimiter();
