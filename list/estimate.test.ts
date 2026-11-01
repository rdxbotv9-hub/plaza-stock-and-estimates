import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { bill, computeTotals, getBillLines } from "../src/lib/estimate-store";

describe("estimate bill totals", () => {
  test("percent discount applies on subtotal", () => {
    expect(computeTotals(10000, "percent", 10)).toEqual({ discount: 1000, total: 9000 });
  });

  test("percent discount above 100 is clamped", () => {
    expect(computeTotals(5000, "percent", 150).total).toBe(0);
  });

  test("fixed amount discount applies and never exceeds subtotal", () => {
    expect(computeTotals(3000, "amount", 800).total).toBe(2200);
    expect(computeTotals(3000, "amount", 9000).total).toBe(0);
  });

  test("negative values are treated as zero", () => {
    expect(computeTotals(3000, "amount", -500).total).toBe(3000);
  });
});

describe("estimate bill store", () => {
  test("adding the same item twice increases quantity", () => {
    bill.clear();
    const item = { id: "t1", code: "A1", name: "Test Item", rate: 500 };
    bill.add(item);
    bill.add(item, 2);
    const lines = getBillLines();
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(3);
    expect(lines[0].unitPrice).toBe(500);
  });

  test("quantity and rate can be edited per line", () => {
    bill.clear();
    const item = { id: "t2", code: "A2", name: "Editable", rate: 1000 };
    bill.add(item);
    const id = getBillLines()[0].id;
    bill.update(id, { qty: 5, unitPrice: 900 });
    expect(getBillLines()[0]).toMatchObject({ qty: 5, unitPrice: 900 });
  });

  test("custom items carry their own name, qty and rate", () => {
    bill.clear();
    bill.addCustom("Special Pot", 450, 2);
    const lines = getBillLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ name: "Special Pot", qty: 2, unitPrice: 450, custom: true });
  });

  test("remove and clear empty the bill", () => {
    bill.clear();
    const item = { id: "t3", code: "A3", name: "Removable", rate: 200 };
    bill.add(item);
    bill.remove(item.id);
    expect(getBillLines()).toHaveLength(0);
  });
});

describe("B5 print setup", () => {
  test("print CSS sets page size to B5", () => {
    const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
    expect(css).toMatch(/size:\s*B5/);
  });
});
