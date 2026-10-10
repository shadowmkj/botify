export function maskShopifyKey(key?: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}****${key.slice(-4)}`;
}
