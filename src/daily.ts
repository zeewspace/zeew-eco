import { Adapter } from "./adapters/adapter";
import { DailyResult, DailyCooldownResult, DailyOptions, Logger } from "./types";

export class Daily {
  private adapter: Adapter;
  private logger?: Logger;
  private baseReward: number;
  private streakBonus: number;
  private maxStreak: number;

  constructor(adapter: Adapter, options?: DailyOptions) {
    this.adapter = adapter;
    this.logger = options?.logger;
    this.baseReward = options?.baseReward ?? 100;
    this.streakBonus = options?.streakBonus ?? 10;
    this.maxStreak = options?.maxStreak ?? 365;
  }

  async claim(user: string, guild: string): Promise<DailyResult | DailyCooldownResult> {
    const record = await this.adapter.findDaily({ user, guild });
    const now = Date.now();
    const oneDay = 86400000;

    if (record) {
      const elapsed = now - record.lastClaim;
      if (elapsed < oneDay) {
        return { error: "already_claimed", nextIn: oneDay - elapsed, streak: record.streak };
      }

      const isConsecutive = elapsed < oneDay * 2;
      const newStreak = isConsecutive ? Math.min(record.streak + 1, this.maxStreak) : 1;
      const earned = this.baseReward + (newStreak - 1) * this.streakBonus;

      await this.adapter.upsertDaily({ user, guild }, { user, guild, lastClaim: now, streak: newStreak });
      await this.addMoney(user, guild, earned);

      this.logger?.debug(`[Daily] ${user} claimed ${earned} (streak: ${newStreak})`);
      return { earned, streak: newStreak, total: await this.getBalance(user, guild) };
    }

    const earned = this.baseReward;
    await this.adapter.upsertDaily({ user, guild }, { user, guild, lastClaim: now, streak: 1 });
    await this.addMoney(user, guild, earned);

    this.logger?.debug(`[Daily] ${user} first claim: ${earned}`);
    return { earned, streak: 1, total: await this.getBalance(user, guild) };
  }

  async getStreak(user: string, guild: string): Promise<number> {
    const record = await this.adapter.findDaily({ user, guild });
    if (!record) return 0;
    const elapsed = Date.now() - record.lastClaim;
    if (elapsed > 86400000 * 2) return 0;
    return record.streak;
  }

  private async addMoney(user: string, guild: string, amount: number): Promise<void> {
    const record = await this.adapter.findMoney({ user, guild });
    const current = record?.money ?? 0;
    await this.adapter.upsertMoney({ user, guild }, current + amount);
  }

  private async getBalance(user: string, guild: string): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    return record?.money ?? 0;
  }
}
