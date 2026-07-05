import { Adapter } from "./adapters/adapter";
import { BadgeDefinition, UserBadge, BadgesOptions, Logger } from "./types";

export class Badges {
  private adapter: Adapter;
  private logger?: Logger;

  constructor(adapter: Adapter, options?: BadgesOptions) {
    this.adapter = adapter;
    this.logger = options?.logger;
  }

  async define(guild: string, id: string, name: string, description: string, icon?: string): Promise<BadgeDefinition> {
    const badge: BadgeDefinition = { id, name, description, icon: icon ?? null };
    await this.adapter.upsertBadgeDefinition(guild, badge);
    this.logger?.debug(`[Badges] defined "${name}" in ${guild}`);
    return badge;
  }

  async list(guild: string): Promise<BadgeDefinition[]> {
    return this.adapter.findBadgeDefinitions(guild);
  }

  async undefine(guild: string, badgeId: string): Promise<boolean> {
    await this.adapter.deleteBadgeDefinition(guild, badgeId);
    this.logger?.debug(`[Badges] removed badge ${badgeId} from ${guild}`);
    return true;
  }

  async award(user: string, guild: string, badgeId: string): Promise<UserBadge | { error: string }> {
    const defs = await this.adapter.findBadgeDefinitions(guild);
    if (!defs.find((d) => d.id === badgeId)) return { error: "badge_not_found" };

    const record = await this.adapter.findUserBadges({ user, guild });
    const badges = record?.badges ?? [];

    if (badges.find((b) => b.badgeId === badgeId)) return { error: "already_awarded" };

    const entry: UserBadge = { badgeId, awardedAt: Date.now() };
    badges.push(entry);
    await this.adapter.upsertUserBadges({ user, guild }, badges);

    this.logger?.debug(`[Badges] awarded "${badgeId}" to ${user}@${guild}`);
    return entry;
  }

  async get(user: string, guild: string): Promise<UserBadge[]> {
    const record = await this.adapter.findUserBadges({ user, guild });
    return record?.badges ?? [];
  }

  async has(user: string, guild: string, badgeId: string): Promise<boolean> {
    const badges = await this.get(user, guild);
    return badges.some((b) => b.badgeId === badgeId);
  }

  async remove(user: string, guild: string, badgeId: string): Promise<boolean> {
    const record = await this.adapter.findUserBadges({ user, guild });
    if (!record) return false;

    const filtered = record.badges.filter((b) => b.badgeId !== badgeId);
    if (filtered.length === record.badges.length) return false;

    await this.adapter.upsertUserBadges({ user, guild }, filtered);
    this.logger?.debug(`[Badges] removed "${badgeId}" from ${user}@${guild}`);
    return true;
  }

  async count(user: string, guild: string): Promise<number> {
    const badges = await this.get(user, guild);
    return badges.length;
  }
}
