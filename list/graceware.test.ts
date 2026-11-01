import { describe, expect, test } from "bun:test";
import { filterGraceware, gracewareCategories, type GracewareProduct } from "../src/lib/graceware";
import catalogue from "../src/lib/graceware-products.json";

const products: GracewareProduct[] = gracewareCategories.map((category, index) => ({
  id: index,
  name: `${category} Sample`,
  category,
  categories: [category],
  sourceUrl: "https://graceware.shop/",
  image: "/sample.jpg",
}));

describe("Graceware collection rules", () => {
  test("authentic catalogue contains names and hosted photos, never prices", () => {
    expect(catalogue).toHaveLength(186);
    for (const product of catalogue) {
      expect(product.name.length).toBeGreaterThan(0);
      expect(product.image.startsWith("/__l5e/assets-v1/")).toBe(true);
      expect(product.sourceUrl.startsWith("https://graceware.shop/products/")).toBe(true);
      expect(Object.keys(product).some((key) => /price|rate|cost/i.test(key))).toBe(false);
    }
  });
  test("catalogue covers the six requested categories", () => {
    for (const category of gracewareCategories) {
      expect(catalogue.some((p) => p.categories.includes(category))).toBe(true);
    }
  });
  test("dinner-set list items are present with hosted photos", () => {
    for (const name of ["Diner Set Grace Artive (8P)", "Diner Set Grace Neorah (8P)", "Diner Set Grace Posh (6P)"]) {
      const product = catalogue.find((p) => p.name === name);
      expect(product).toBeDefined();
      expect(product!.category).toBe("Dinner Sets");
    }
  });
  test("household list items are present with hosted photos", () => {
    for (const name of ["Basket Grace Miniso", "Grace Dustbin (40LTR)", "Laundry Grace Pixel"]) {
      expect(catalogue.some((p) => p.name === name)).toBe(true);
    }
  });
  test("gift hotpots remain available in both requested categories", () => {
    const product = { ...products[0], id: 1, name: "Gift Hotpot", category: "Gift Sets" as const, categories: ["Gift Sets", "Hot Pots"] as GracewareProduct["categories"], image: "/sample.jpg", sourceUrl: "https://graceware.shop/" };
    expect(filterGraceware([product], "Gift Sets", "")).toHaveLength(1);
    expect(filterGraceware([product], "Hot Pots", "")).toHaveLength(1);
  });
  test("includes the six requested categories", () => {
    expect([...gracewareCategories]).toEqual(["Dinner Sets", "Gift Sets", "Tray Sets", "Bath Sets", "Hot Pots", "Household"]);
  });
  test("category selection excludes products from other categories", () => {
    expect(filterGraceware(products, "Bath Sets", "").map((p) => p.name)).toEqual(["Bath Sets Sample"]);
  });
  test("search matches real product names without case sensitivity", () => {
    expect(filterGraceware(products, "All", "  hot pots  ").map((p) => p.name)).toEqual(["Hot Pots Sample"]);
    expect(filterGraceware(products, "All", "nonexistent")).toEqual([]);
  });
});