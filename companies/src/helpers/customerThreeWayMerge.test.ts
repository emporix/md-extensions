import { describe, expect, it } from "vitest";
import { CustomerBusinessModel } from "../models/Customer";
import type { Customer } from "../models/Customer";
import {
  analyzeCustomerThreeWayMerge,
  buildCustomerMergeWithResolutions,
  collectChangedPaths,
  substantiveCustomerEquals,
} from "./customerThreeWayMerge";

function sampleCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    customerNumber: "C1",
    id: "cust-1",
    firstName: "A",
    lastName: "B",
    businessModel: CustomerBusinessModel.B2C,
    b2b: { legalEntities: [], companyRegistrationId: null },
    active: true,
    contactEmail: "a@b.c",
    contactPhone: "",
    onHold: false,
    preferredCurrency: "",
    preferredLanguage: "",
    preferredSite: "",
    title: "MR",
    metadata: { mixins: {}, version: 3, modifiedAt: "t1" },
    addresses: [],
    ...overrides,
  };
}

describe("customerThreeWayMerge", () => {
  it("treats identical substantive payloads as equal even when lock metadata differs", () => {
    const a = sampleCustomer({
      metadata: { mixins: {}, version: 1, modifiedAt: "x" },
    });
    const b = sampleCustomer({
      metadata: { mixins: {}, version: 9, modifiedAt: "y" },
    });
    expect(substantiveCustomerEquals(a, b)).toBe(true);
    expect(collectChangedPaths(a, b).size).toBe(0);
  });

  it("merges disjoint scalar edits onto server", () => {
    const base = sampleCustomer({
      firstName: "A",
      lastName: "B",
      metadata: { mixins: {}, version: 1, modifiedAt: "x" },
    });
    const server = sampleCustomer({
      firstName: "Remote",
      lastName: "B",
      metadata: { mixins: {}, version: 2, modifiedAt: "y" },
    });
    const local = sampleCustomer({
      firstName: "A",
      lastName: "Local",
      metadata: { mixins: {}, version: 1, modifiedAt: "x" },
    });

    const result = analyzeCustomerThreeWayMerge(base, local, server);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.merged.firstName).toBe("Remote");
      expect(result.merged.lastName).toBe("Local");
      expect(result.merged.metadata.version).toBe(2);
      expect(result.merged.metadata.modifiedAt).toBe("y");
    }
  });

  it("detects overlapping incompatible edits", () => {
    const base = sampleCustomer({
      firstName: "A",
      metadata: { mixins: {}, version: 1, modifiedAt: "x" },
    });
    const server = sampleCustomer({
      firstName: "Server",
      metadata: { mixins: {}, version: 2, modifiedAt: "y" },
    });
    const local = sampleCustomer({
      firstName: "Local",
      metadata: { mixins: {}, version: 1, modifiedAt: "x" },
    });

    const result = analyzeCustomerThreeWayMerge(base, local, server);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.paths.some((p) => p === "firstName")).toBe(true);
      const fc = result.conflicts.find((c) => c.path === "firstName");
      expect(fc?.localValue).toBe("Local");
      expect(fc?.serverValue).toBe("Server");
      expect(fc?.baseValue).toBe("A");
    }
  });

  it("buildCustomerMergeWithResolutions respects mine vs theirs", () => {
    const base = sampleCustomer({
      firstName: "A",
      lastName: "B",
      metadata: { mixins: {}, version: 1, modifiedAt: "x" },
    });
    const server = sampleCustomer({
      firstName: "Server",
      lastName: "ServerLast",
      metadata: { mixins: {}, version: 2, modifiedAt: "y" },
    });
    const local = sampleCustomer({
      firstName: "Local",
      lastName: "LocalLast",
      metadata: { mixins: {}, version: 1, modifiedAt: "x" },
    });

    const mergedMineFirst = buildCustomerMergeWithResolutions(
      base,
      local,
      server,
      {
        firstName: "mine",
        lastName: "mine",
      },
    );
    expect(mergedMineFirst.firstName).toBe("Local");
    expect(mergedMineFirst.lastName).toBe("LocalLast");
    expect(mergedMineFirst.metadata.version).toBe(2);

    const mergedTheirsFirst = buildCustomerMergeWithResolutions(
      base,
      local,
      server,
      {
        firstName: "theirs",
        lastName: "mine",
      },
    );
    expect(mergedTheirsFirst.firstName).toBe("Server");
    expect(mergedTheirsFirst.lastName).toBe("LocalLast");
  });
});
