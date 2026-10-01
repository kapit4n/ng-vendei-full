/**
 * Business-type ("store type") filtering for product lists.
 *
 * Products carry only `storeProfileId`; the profile that owns the product holds
 * the `businessType` label. These helpers join the two and build the chip row,
 * so the list page does not need to know the profile/type relationship.
 */

/** The subset of a store profile this needs. */
export interface StoreTypeRef {
  id: string | number;
  businessType?: string | null;
  slug?: string | null;
  name?: string | null;
}

/** One selectable chip. `type` is the filter key written on the product row. */
export interface StoreTypeChip {
  /** Filter key; matches a product's `storeProfileId`. */
  profileId: string | number;
  /** Raw business type, e.g. `chicken-store`. */
  businessType: string;
  /** Human label for the chip, e.g. `Chicken store`. */
  label: string;
  /** Number of products owned by this profile. */
  count: number;
}

/** Anything with a product's profile reference. */
export interface ProductProfileRef {
  storeProfileId?: string | number | null;
}

/** `chicken-store` -> `Chicken store`. Falls back to the slug, then `Unknown`. */
export function storeTypeLabel(type: string | null | undefined): string {
  const raw = (type || '').trim();
  if (!raw) {
    return 'Unknown';
  }
  const words = raw.replace(/[-_]+/g, ' ').trim();
  return words
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Canonical filter key for a profile: `businessType`, else `slug`, else `''`. */
export function storeTypeKey(profile: StoreTypeRef | null | undefined): string {
  return ((profile?.businessType || profile?.slug || '') as string).trim();
}

/**
 * Chips for the profiles that actually own at least one product, ordered by
 * descending product count then label, so the busiest business leads.
 *
 * Products whose profile is unknown are not given a chip: they belong to
 * whichever filter is active, and "All" always shows them.
 */
export function storeTypeChips<T extends ProductProfileRef>(
  products: readonly T[] | null | undefined,
  profiles: readonly StoreTypeRef[] | null | undefined
): StoreTypeChip[] {
  const list = products ?? [];
  const counts = new Map<string, number>();
  const byKey = new Map<string, StoreTypeRef>();

  for (const profile of profiles ?? []) {
    if (profile?.id === undefined || profile?.id === null) {
      continue;
    }
    const key = storeTypeKey(profile);
    if (!key) {
      continue;
    }
    // Two profiles can share a businessType; keep the first for labelling.
    if (!byKey.has(key)) {
      byKey.set(key, profile);
    }
  }

  for (const product of list) {
    const id = product?.storeProfileId;
    if (id === undefined || id === null || id === '') {
      continue;
    }
    const profile = (profiles ?? []).find((p) => String(p.id) === String(id));
    if (!profile) {
      continue;
    }
    const key = storeTypeKey(profile);
    if (!key) {
      continue;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([businessType, count]) => {
      const profile = byKey.get(businessType)!;
      return {
        profileId: profile.id,
        businessType,
        label: storeTypeLabel(businessType),
        count,
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Products for the active chip. `profileId` of `null` means "All" and returns
 * everything; an unknown value matches nothing.
 */
export function filterProductsByStoreType<T extends ProductProfileRef>(
  products: readonly T[] | null | undefined,
  profileId: string | number | null
): T[] {
  const list = products ?? [];
  if (profileId === null || profileId === undefined || profileId === '') {
    return [...list];
  }
  return list.filter((p) => String(p?.storeProfileId) === String(profileId));
}
