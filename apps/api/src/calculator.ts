import Decimal from "decimal.js";
export function calculate(
  area: string | number,
  waste: string | number,
  boxArea: string | number,
  price: string | number,
  vat: string | number,
) {
  const a = new Decimal(area),
    w = new Decimal(waste),
    b = new Decimal(boxArea),
    p = new Decimal(price),
    v = new Decimal(vat);
  if (
    ![a, w, b, p, v].every((x) => x.isFinite()) ||
    a.lte(0) ||
    b.lte(0) ||
    w.lt(0) ||
    w.gt(100) ||
    p.lt(0) ||
    v.lt(0) ||
    v.gt(100)
  )
    throw new Error("Geçersiz hesaplama girdisi");
  const required = a.mul(w.div(100).plus(1)),
    boxes = required.div(b).ceil(),
    actual = boxes.mul(b),
    subtotal = actual.mul(p).toDecimalPlaces(2),
    tax = subtotal.mul(v).div(100).toDecimalPlaces(2);
  return {
    required: required.toFixed(4),
    boxes: boxes.toNumber(),
    area: actual.toFixed(4),
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: subtotal.plus(tax).toFixed(2),
  };
}
