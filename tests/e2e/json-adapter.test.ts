import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { JsonAdapter } from "../../src/adapters/json";
import { Economy } from "../../src/economy";
import { Store } from "../../src/store";
import { Inventory } from "../../src/inventory";
import { Bank } from "../../src/bank";

const TEST_FILE = path.join(__dirname, "../.test-data.json");

function cleanup(): void {
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
}

describe("E2E with JsonAdapter", () => {
  let adapter: JsonAdapter;
  let eco: Economy;
  let store: Store;
  let inv: Inventory;
  let bank: Bank;

  beforeEach(() => {
    cleanup();
    adapter = new JsonAdapter(TEST_FILE);
    eco = new Economy(adapter);
    store = new Store(adapter);
    inv = new Inventory(adapter);
    bank = new Bank(adapter);
  });

  afterEach(() => {
    cleanup();
  });

  it("full economy lifecycle: earn, buy, inventory", async () => {
    const user = "user1";
    const guild = "guild1";

    // Start with nothing
    expect(await eco.get(user, guild)).toBe(0);
    expect(await inv.get(user, guild)).toEqual([]);

    // Work to earn money
    const earned = await eco.work(user, guild, 500);
    expect(earned).toBeGreaterThanOrEqual(0);
    expect(await eco.get(user, guild)).toBe(earned);

    // Add more money directly
    await eco.add(user, guild, 1000);
    const balance = await eco.get(user, guild);
    expect(balance).toBe(earned + 1000);

    // Create store items
    const item1 = await store.add(guild, "VIP Role", "Get VIP access", 500, "role_vip");
    const item2 = await store.add(guild, "Custom Channel", "Your own channel", 300, null);
    expect(await store.get(guild)).toHaveLength(2);

    // Buy first item
    const buy1 = await eco.buy(user, guild, item1.id);
    if ("error" in buy1) throw new Error(`Buy failed: ${buy1.error}`);
    expect(buy1.item.name).toBe("VIP Role");
    expect(buy1.newMoney).toBe(balance - 500);

    // Check inventory
    const items = await inv.get(user, guild);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("VIP Role");
    expect(items[0].item).toBe("role_vip");

    // Buy second item
    const buy2 = await eco.buy(user, guild, item2.id);
    if ("error" in buy2) throw new Error(`Buy failed: ${buy2.error}`);
    expect(await inv.get(user, guild)).toHaveLength(2);

    // Verify final balance
    expect(await eco.get(user, guild)).toBe(balance - 500 - 300);
  });

  it("bank deposit and withdraw flow", async () => {
    const user = "user1";
    const guild = "guild1";

    // Give user money
    await eco.add(user, guild, 1000);
    expect(await eco.get(user, guild)).toBe(1000);

    // Deposit to bank
    const dep = await bank.deposit(user, guild, 400);
    if ("error" in dep) throw new Error(`Deposit failed: ${dep.error}`);
    expect(dep.economy).toBe(600);
    expect(dep.bank).toBe(400);

    // Verify balances
    expect(await eco.get(user, guild)).toBe(600);
    expect(await bank.get(user, guild)).toBe(400);

    // Withdraw from bank
    const wd = await bank.withdraw(user, guild, 150);
    if ("error" in wd) throw new Error(`Withdraw failed: ${wd.error}`);
    expect(wd.economy).toBe(750);
    expect(wd.bank).toBe(250);
  });

  it("data persists across adapter re-instantiation", async () => {
    const user = "user1";
    const guild = "guild1";

    await eco.add(user, guild, 500);
    await store.add(guild, "Sword", "A blade", 100, null);
    await inv.add(user, guild, "Potion", "hp_boost");
    await bank.add(user, guild, 200);

    // Re-create adapter (simulates restart)
    const adapter2 = new JsonAdapter(TEST_FILE);
    const eco2 = new Economy(adapter2);
    const store2 = new Store(adapter2);
    const inv2 = new Inventory(adapter2);
    const bank2 = new Bank(adapter2);

    expect(await eco2.get(user, guild)).toBe(500);
    expect(await store2.get(guild)).toHaveLength(1);
    expect(await inv2.get(user, guild)).toHaveLength(1);
    expect(await bank2.get(user, guild)).toBe(200);
  });

  it("resets clear all data correctly", async () => {
    const user = "user1";
    const guild = "guild1";

    await eco.add(user, guild, 500);
    await store.add(guild, "Sword", "A blade", 100, null);
    await inv.add(user, guild, "Potion", null);
    await bank.add(user, guild, 200);

    // Reset everything
    await eco.reset(user, guild);
    await store.reset(guild);
    await inv.reset(user, guild);
    await bank.reset(user, guild);

    expect(await eco.get(user, guild)).toBe(0);
    expect(await store.get(guild)).toEqual([]);
    expect(await inv.get(user, guild)).toEqual([]);
    expect(await bank.get(user, guild)).toBe(0);
  });

  it("multiple users and guilds are isolated", async () => {
    // User1 in Guild1
    await eco.add("user1", "guild1", 100);
    // User2 in Guild1
    await eco.add("user2", "guild1", 200);
    // User1 in Guild2
    await eco.add("user1", "guild2", 300);

    expect(await eco.get("user1", "guild1")).toBe(100);
    expect(await eco.get("user2", "guild1")).toBe(200);
    expect(await eco.get("user1", "guild2")).toBe(300);

    // Reset user1 guild1 does not affect others
    await eco.reset("user1", "guild1");
    expect(await eco.get("user1", "guild1")).toBe(0);
    expect(await eco.get("user2", "guild1")).toBe(200);
    expect(await eco.get("user1", "guild2")).toBe(300);
  });

  it("JSON file is valid after operations", async () => {
    await eco.add("user1", "guild1", 100);
    await store.add("guild1", "Item", "Desc", 50, null);
    await inv.add("user1", "guild1", "Thing", null);
    await bank.add("user1", "guild1", 75);

    const raw = fs.readFileSync(TEST_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed).toHaveProperty("money");
    expect(parsed).toHaveProperty("stores");
    expect(parsed).toHaveProperty("inventory");
    expect(parsed).toHaveProperty("bank");
    expect(Array.isArray(parsed.money)).toBe(true);
    expect(Array.isArray(parsed.stores)).toBe(true);
    expect(Array.isArray(parsed.inventory)).toBe(true);
    expect(Array.isArray(parsed.bank)).toBe(true);
  });

  it("handles corrupted JSON file gracefully", () => {
    fs.writeFileSync(TEST_FILE, "{invalid json!!!}", "utf-8");
    const adapter2 = new JsonAdapter(TEST_FILE);

    // Should start fresh with empty data
    expect(adapter2).toBeDefined();
  });

  it("buy fails gracefully with insufficient funds", async () => {
    await eco.add("user1", "guild1", 50);
    const item = await store.add("guild1", "Expensive", "Very expensive", 999, null);

    const result = await eco.buy("user1", "guild1", item.id);
    expect(result).toEqual({ error: "insufficient_funds" });

    // Money should not change
    expect(await eco.get("user1", "guild1")).toBe(50);
    // Inventory should be empty
    expect(await inv.get("user1", "guild1")).toEqual([]);
  });
});
