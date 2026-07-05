import { Adapter } from "./adapters/adapter";
import { MarketListing, MarketOptions, Logger } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class Market {
  private adapter: Adapter;
  private logger?: Logger;
  private feePercent: number;

  constructor(adapter: Adapter, options?: MarketOptions) {
    this.adapter = adapter;
    this.logger = options?.logger;
    this.feePercent = options?.feePercent ?? 5;
  }

  async list(
    seller: string,
    guild: string,
    itemName: string,
    price: number,
    options?: { item?: string; currency?: string }
  ): Promise<MarketListing> {
    const listing: MarketListing = {
      id: generateId(),
      seller,
      guild,
      itemName,
      item: options?.item ?? null,
      price,
      currency: options?.currency ?? "default",
      createdAt: Date.now(),
    };

    await this.adapter.addListing(listing);
    this.logger?.debug(`[Market] ${seller} listed "${itemName}" for ${price} in ${guild}`);
    return listing;
  }

  async buy(
    buyer: string,
    guild: string,
    listingId: string
  ): Promise<{ listing: MarketListing; fee: number } | { error: string }> {
    const listing = await this.adapter.findListing(listingId);
    if (!listing) return { error: "listing_not_found" };
    if (listing.seller === buyer) return { error: "cannot_buy_own_listing" };

    const buyerBalance = await this.getBalance(buyer, guild, listing.currency);
    if (buyerBalance < listing.price) return { error: "insufficient_funds" };

    const fee = Math.floor(listing.price * (this.feePercent / 100));
    const sellerReceives = listing.price - fee;

    const sellerBalance = await this.getBalance(listing.seller, guild, listing.currency);

    await this.setBalance(buyer, guild, listing.currency, buyerBalance - listing.price);
    await this.setBalance(listing.seller, guild, listing.currency, sellerBalance + sellerReceives);
    await this.adapter.removeListing(listingId);

    this.logger?.debug(
      `[Market] ${buyer} bought "${listing.itemName}" from ${listing.seller} for ${listing.price} (fee: ${fee})`
    );

    return { listing, fee };
  }

  async getGuildListings(guild: string): Promise<MarketListing[]> {
    return this.adapter.getGuildListings(guild);
  }

  async getUserListings(user: string, guild: string): Promise<MarketListing[]> {
    return this.adapter.getUserListings(user, guild);
  }

  async cancel(user: string, guild: string, listingId: string): Promise<boolean> {
    const listing = await this.adapter.findListing(listingId);
    if (!listing) return false;
    if (listing.seller !== user) return false;
    await this.adapter.removeListing(listingId);
    this.logger?.debug(`[Market] ${user} cancelled listing ${listingId}`);
    return true;
  }

  private async getBalance(user: string, guild: string, currency: string): Promise<number> {
    const record = await this.adapter.findMoney({ user, guild });
    if (currency === "default") return record?.money ?? 0;
    return record?.currencies?.[currency] ?? 0;
  }

  private async setBalance(user: string, guild: string, currency: string, value: number): Promise<void> {
    const record = await this.adapter.findMoney({ user, guild });
    if (currency === "default") {
      await this.adapter.upsertMoney({ user, guild }, value, record?.currencies);
    } else {
      const currencies: Record<string, number> = { ...(record?.currencies ?? {}) };
      currencies[currency] = value;
      await this.adapter.upsertMoney({ user, guild }, record?.money ?? 0, currencies);
    }
  }
}
