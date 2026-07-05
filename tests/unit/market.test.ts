import { describe, it, expect, beforeEach, vi } from "vitest";
import { Market } from "../../src/market";
import { MockAdapter } from "../mock-adapter";

describe("Market", () => {
  let adapter: MockAdapter;
  let market: Market;

  beforeEach(async () => {
    adapter = new MockAdapter();
    market = new Market(adapter);
    await adapter.upsertMoney({ user: "buyer", guild: "g1" }, 1000);
    await adapter.upsertMoney({ user: "seller", guild: "g1" }, 0);
  });

  it("creates a listing", async () => {
    const listing = await market.list("seller", "g1", "Sword", 500, { item: "role1" });
    expect(listing.itemName).toBe("Sword");
    expect(listing.price).toBe(500);
    expect(listing.seller).toBe("seller");
  });

  it("returns guild listings", async () => {
    await market.list("seller", "g1", "Sword", 100);
    await market.list("seller", "g1", "Shield", 200);
    const listings = await market.getGuildListings("g1");
    expect(listings).toHaveLength(2);
  });

  it("returns user listings", async () => {
    await market.list("seller", "g1", "Sword", 100);
    await market.list("other", "g1", "Shield", 200);
    const listings = await market.getUserListings("seller", "g1");
    expect(listings).toHaveLength(1);
  });

  it("buyer purchases listing", async () => {
    const listing = await market.list("seller", "g1", "Sword", 500, { item: "role1" });
    const result = await market.buy("buyer", "g1", listing.id);
    expect(result).toHaveProperty("listing");
    expect(result).toHaveProperty("fee");

    const buyerBal = await adapter.findMoney({ user: "buyer", guild: "g1" });
    expect(buyerBal?.money).toBe(500); // 1000 - 500

    const sellerBal = await adapter.findMoney({ user: "seller", guild: "g1" });
    expect(sellerBal?.money).toBe(475); // 500 - 25 fee
  });

  it("returns error when listing not found", async () => {
    const result = await market.buy("buyer", "g1", "nonexistent");
    expect(result).toEqual({ error: "listing_not_found" });
  });

  it("returns error when buying own listing", async () => {
    const listing = await market.list("buyer", "g1", "Sword", 500);
    const result = await market.buy("buyer", "g1", listing.id);
    expect(result).toEqual({ error: "cannot_buy_own_listing" });
  });

  it("returns error when insufficient funds", async () => {
    await adapter.upsertMoney({ user: "poor", guild: "g1" }, 10);
    const listing = await market.list("seller", "g1", "Sword", 500);
    const result = await market.buy("poor", "g1", listing.id);
    expect(result).toEqual({ error: "insufficient_funds" });
  });

  it("seller can cancel listing", async () => {
    const listing = await market.list("seller", "g1", "Sword", 500);
    expect(await market.cancel("seller", "g1", listing.id)).toBe(true);
    expect(await market.getGuildListings("g1")).toHaveLength(0);
  });

  it("other user cannot cancel listing", async () => {
    const listing = await market.list("seller", "g1", "Sword", 500);
    expect(await market.cancel("other", "g1", listing.id)).toBe(false);
  });

  it("charges fee percent", async () => {
    const noFeeMarket = new Market(adapter, { feePercent: 0 });
    const listing = await market.list("seller", "g1", "Sword", 1000);
    const result = await market.buy("buyer", "g1", listing.id);
    if ("fee" in result) expect(result.fee).toBe(50);
  });

  it("calls logger", async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
    const loggedMarket = new Market(adapter, { logger });
    await loggedMarket.list("seller", "g1", "Sword", 100);
    expect(logger.debug).toHaveBeenCalled();
  });
});
