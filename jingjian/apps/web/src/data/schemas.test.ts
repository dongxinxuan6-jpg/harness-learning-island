import { describe, expect, it } from "vitest";
import products from "../../public/data/products/index.json";
import weekly from "../../public/data/weekly/latest.json";
import { validatePublicData } from "./schemas";

describe("validatePublicData", () => {
  it("validates known collection and weekly contracts", () => {
    expect(validatePublicData("/data/products/index.json", products)).toEqual(products);
    expect(validatePublicData("/data/weekly/latest.json", weekly)).toEqual(weekly);
  });

  it("rejects malformed records on known routes", () => {
    expect(() => validatePublicData("/data/products/index.json", { items: [{}] })).toThrow();
    expect(() => validatePublicData("/data/products/broken.json", {})).toThrow();
  });
});
