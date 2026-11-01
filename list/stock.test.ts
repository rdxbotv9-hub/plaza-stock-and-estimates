import { describe, expect, test } from "bun:test";
import stock from "./ALL_STOCK.json";

describe("October stock replacement", () => {
  test("contains the complete replacement list", () => {
    expect(stock).toHaveLength(1314);
  });

  test("uses the uploaded quantity for WP-1045", () => {
    const item = stock.find((row) => "code" in row && row.code === "WP-1045");
    expect(item?.qty_inhand).toBe(7);
    expect(item?.rate).toBe(23680);
    expect(item?.description).toBe("1045 MEAT MINDER");
  });

  test("keeps duplicate descriptions as supplier instead of losing product names", () => {
    const item = stock.find((row) => "code" in row && row.code === "WP-07");
    expect(item?.description).toBe("07 MULTI WONDER");
    expect(item && "vendor" in item ? item.vendor : undefined).toBe("WEST POINT (KARACHI)");
  });
});