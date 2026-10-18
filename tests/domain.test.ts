import assert from 'node:assert/strict';
import test from 'node:test';
import { lineTotal, money, quoteTotals } from '../src/domain/money.ts';
import { normalisePhone, validDate } from '../src/domain/model.ts';
const line=(quantity:string,price:string)=>({id:'x',description:'Work',quantity,unit:'job',price});
test('AC-03 discount calculation uses exact amounts',()=>{
 const totals=quoteTotals([line('2','10000'),line('1','5000')],'10');
 assert.deepEqual(totals,{subtotal:2500000n,discount:250000n,total:2250000n});
});
test('fractional quantities round half-up once per line',()=>{assert.equal(lineTotal(line('0.125','0.04')),1n);assert.equal(money(123456789n),'MWK 1,234,567.89');});
test('invalid amounts, excessive precision and discounts rejected',()=>{for(const l of [line('-1','1'),line('0','1'),line('1','NaN'),line('1','1.234')])assert.throws(()=>lineTotal(l));assert.throws(()=>quoteTotals([line('1','1')],'101'));assert.throws(()=>quoteTotals([],'0'));});
test('normalises Malawi and supports explicit international phones',()=>{assert.equal(normalisePhone('0881 234 567'),'+265881234567');assert.equal(normalisePhone('+27 82 123 4567'),'+27821234567');assert.throws(()=>normalisePhone('abc'));});
test('calendar validation rejects overflow dates',()=>{assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('25/10/2026'),false);});
