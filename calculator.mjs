export function units(value, places) {
 const text=String(value).replace(',', '.');
 if(!/^\d+(\.\d+)?$/.test(text))throw Error('Pozitif bir sayı girin.');
 const [whole,part='']=text.split('.');
 if(part.length>places)throw Error(`En fazla ${places} ondalık basamak kullanın.`);
 return BigInt(whole+part.padEnd(places,'0'));
}
function fixed(n,p){const s=String(n).padStart(p+1,'0');return s.slice(0,-p)+'.'+s.slice(-p);}
export function calculate(product,area,waste){
 const a=units(area,4),w=units(waste,2),box=units(product.boxArea,4);
 if(a<=0n||a>10000000000n||w>10000n||box<=0n)throw Error('Alan 0–1.000.000 m², fire %0–100 arasında olmalı.');
 const needed=a*(10000n+w),denominator=box*10000n;
 const boxes=(needed+denominator-1n)/denominator,actual=boxes*box;
 const subtotal=(actual*units(product.price,2)+5000n)/10000n;
 const tax=(subtotal*units(product.vatRate,2)+5000n)/10000n;
 return {required:fixed((needed+5000n)/10000n,4),boxes:Number(boxes),area:fixed(actual,4),subtotal:fixed(subtotal,2),tax:fixed(tax,2),total:fixed(subtotal+tax,2)};
}
