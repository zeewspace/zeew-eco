import { Adapter } from "./adapters/adapter";
import { DepositResult, WithdrawResult } from "./types";

export class Bank {
  constructor(private adapter: Adapter) {}

  async get(user: string, guild: string): Promise<number> {
    const record = await this.adapter.findBank({ user, guild });
    return record?.money ?? 0;
  }

  async add(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findBank({ user, guild });
    const current = record?.money ?? 0;
    const next = current + amount;
    await this.adapter.upsertBank({ user, guild }, next);
    return next;
  }

  async remove(user: string, guild: string, amount: number): Promise<number> {
    const record = await this.adapter.findBank({ user, guild });
    const current = record?.money ?? 0;
    const next = Math.max(0, current - amount);
    await this.adapter.upsertBank({ user, guild }, next);
    return next;
  }

  async reset(user: string, guild: string): Promise<boolean> {
    await this.adapter.deleteBank({ user, guild });
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

    return { economy: newEconomy, bank: newBank };
  }
}
