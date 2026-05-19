/**
 * Structural typing avoids incompatible `TFunction` brands between `i18next` and `react-i18next`
 * under strict composite builds (`yarn build:prod`).
 */
export type MergeConflictTranslateFn = (
  key: string,
  options?: Record<string, unknown>,
) => string;

const DETAIL_ROOT_FIELDS = new Set([
  "id",
  "businessModel",
  "customerNumber",
  "firstName",
  "lastName",
  "contactEmail",
  "contactPhone",
  "onHold",
  "active",
  "preferredCurrency",
  "preferredLanguage",
  "preferredSite",
  "title",
  "restriction",
]);

/** Friendly labels for merge-conflict paths (details.useExisting translations where possible). */
export function getMergeConflictPathLabel(
  path: string,
  t: MergeConflictTranslateFn,
): string {
  const segments = path.split(".");
  const root = segments[0];

  if (root === "addresses") {
    if (segments.length < 3) {
      return t("customers.mergeConflict.addressLabel", {
        id: segments[1] ?? "?",
      });
    }
    const addrId = segments[1];
    const fieldTail = segments.slice(2).join(".");
    const addressHeading = t("customers.mergeConflict.addressLabel", {
      id: addrId,
    });
    if (!fieldTail) return addressHeading;
    const fieldLabel =
      fieldTail.includes(".") || fieldTail === "mixins"
        ? fieldTail
        : t(`customers.address.${fieldTail}`, { defaultValue: fieldTail });
    return `${addressHeading}: ${fieldLabel}`;
  }

  if (root === "mixins") {
    const mixinKey = segments[1] ?? "";
    const rest = segments.slice(2).join(".");
    return t("customers.mergeConflict.mixinLabel", {
      key: mixinKey,
      path: rest || mixinKey,
    });
  }

  if (root === "metadata") {
    const metaPath = segments.slice(1).join(".");
    return t("customers.mergeConflict.metadataPath", { path: metaPath });
  }

  if (root === "b2b") {
    const b2bPath = segments.slice(1).join(".");
    return t("customers.mergeConflict.b2bPath", { path: b2bPath });
  }

  if (segments.length === 1 && DETAIL_ROOT_FIELDS.has(root)) {
    return t(`customers.details.${root}`, { defaultValue: root });
  }

  return t("customers.mergeConflict.genericPath", { path });
}
