import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../apps/api/src/calculator";
test("47 m², %10 fire ve 1.44 m² koli: 36 koli / 51.84 m²", () => {
  assert.deepEqual(calculate(47, 10, "1.44", 500, 20), {
    required: "51.7000",
    boxes: 36,
    area: "51.8400",
    subtotal: "25920.00",
    tax: "5184.00",
    total: "31104.00",
  });
});
test("tam koli sınırında fazladan koli üretmez", () => {
  assert.equal(calculate("4.32", 0, "1.44", 1, 20).boxes, 3);
});
test("ondalık fiyatı kuruş düzeyinde yuvarlar", () => {
  assert.equal(calculate(1, 0, 1, "19.99", 20).total, "23.99");
});
test("geçersiz alan, fire, fiyat ve vergi reddedilir", () => {
  for (const values of [
    [0, 10, 1.44, 500, 20],
    [-1, 10, 1.44, 500, 20],
    [1, 101, 1.44, 500, 20],
    [1, 10, 0, 500, 20],
    [1, 10, 1.44, -1, 20],
    [1, 10, 1.44, 500, 101],
  ])
    assert.throws(() =>
      calculate(...(values as [number, number, number, number, number])),
    );
});
