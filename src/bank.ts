import { Adapter } from "./adapters/adapter";
import { DepositResult, WithdrawResult, LeaderboardEntry, BankOptions } from "./types";

export class Bank {
  private adapter: Adapter;
  private hooks;
  private logger;

  constructor(adapter: Adapter, options?: BankOptions) {
    this.adapter = adapter;
    this.hooks = options?.hooks;
    this.logger = options?.logger;
  }

  async get(user: string, guild: string): Promise<number> {
    const record = await this.adapter.findBank({ user, guild });
    return record?.money ?? 0;
  }

  async add(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findBank({ user, guild });
    const old = record?.money ?? 0;
    const next = old + amount;
    await this.adapter.upsertBank({ user, guild }, next);
    this.logger?.debug(`[Bank] add ${amount} to ${user}@${guild} → ${next}`);
    this.hooks?.onBalanceChange?.(user, guild, old, next);
    return next;
  }

  async remove(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findBank({ user, guild });
    const old = record?.money ?? 0;
    const next = Math.max(0, old - amount);
    await this.adapter.upsertBank({ user, guild }, next);
    this.logger?.debug(`[Bank] remove ${amount} from ${user}@${guild} → ${next}`);
    this.hooks?.onBalanceChange?.(user, guild, old, next);
    return next;
  }

  async reset(user: string, guild: string): Promise<boolean> {
    await this.adapter.deleteBank({ user, guild });
    this.logger?.debug(`[Bank] reset ${user}@${guild}`);
    return true;
  }

  async deposit(user: string, guild: string, amount: number): Promise<DepositResult | { error: string }> {
    const [bankRecord, moneyRecord] = await Promise.all([
      this.adapter.findBank({ user, guild }),
      this.adapter.findMoney({ user, guild }),
    ]);

    if (!moneyRecord) return { error: "economy_not_found" };
    if (moneyRecord.money < amount) return { error: "insufficient_funds" };

    const currentBank = bankRecord?.money ?? 0;
    const newBank = currentBank + amount;
    const newEconomy = moneyRecord.money - amount;

    await Promise.all([
      this.adapter.upsertBank({ user, guild }, newBank),
      this.adapter.upsertMoney({ user, guild }, newEconomy),
    ]);

    this.logger?.debug(`[Bank] ${user} deposited ${amount}`);
    this.hooks?.onBalanceChange?.(user, guild, moneyRecord.money, newEconomy);
    this.hooks?.onDeposit?.(user, guild, amount);

    return { economy: newEconomy, bank: newBank };
  }

  async withdraw(user: string, guild: string, amount: number): Promise<WithdrawResult | { error: string }> {
    const [bankRecord, moneyRecord] = await Promise.all([
      this.adapter.findBank({ user, guild }),
      this.adapter.findMoney({ user, guild }),
    ]);

    if (!bankRecord) return { error: "bank_not_found" };
    if (bankRecord.money < amount) return { error: "insufficient_funds" };

    const currentEconomy = moneyRecord?.money ?? 0;
    const newBank = bankRecord.money - amount;
    const newEconomy = currentEconomy + amount;

    await Promise.all([
      this.adapter.upsertBank({ user, guild }, newBank),
      this.adapter.upsertMoney({ user, guild }, newEconomy),
    ]);

    this.logger?.debug(`[Bank] ${user} withdrew ${amount}`);
    this.hooks?.onBalanceChange?.(user, guild, currentEconomy, newEconomy);
    this.hooks?.onWithdraw?.(user, guild, amount);

    return { economy: newEconomy, bank: newBank };
  }

  async leaderboard(guild: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const all = await this.adapter.allBank(guild);
    return all
      .sort((a, b) => b.money - a.money)
      .slice(0, limit)
      .map((r) => ({ user: r.user, guild: r.guild, money: r.money }));
  }
}
