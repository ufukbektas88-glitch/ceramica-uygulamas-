import {test} from 'node:test';import assert from 'node:assert/strict';
const modulePromise=import('../apps/phone-demo/calculator.mjs');
const p={boxArea:'1.44',price:'500',vatRate:'20'};
test('telefon web demosu 47 m² için kesin koli/vergi hesabı',async()=>{const {calculate}=await modulePromise;assert.deepEqual(calculate(p,'47','10'),{required:'51.7000',boxes:36,area:'51.8400',subtotal:'25920.00',tax:'5184.00',total:'31104.00'})});
test('telefon demosu Türkçe ondalık ve tam koli sınırını destekler',async()=>{const {calculate}=await modulePromise;assert.equal(calculate(p,'4,32','0').boxes,3);assert.throws(()=>calculate(p,'1','101'));assert.throws(()=>calculate(p,'0','10'));});
