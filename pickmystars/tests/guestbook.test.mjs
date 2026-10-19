import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareEntry, readEntries, saveEntry } from '../src/guestbook/storage.ts';
test('빈 닉네임은 익명으로 표시하고 공백 메시지와 글자 수 초과는 거부한다',()=>{
 assert.equal(prepareEntry('  ',' 응원해요! ').nickname,'익명');
 assert.equal(prepareEntry('별',' 응원해요! ').message,'응원해요!');
 for(const message of ['  ','a'.repeat(151)]) assert.throws(()=>prepareEntry('',message));
 assert.throws(()=>prepareEntry('a'.repeat(21),'안녕'));
});
test('저장한 글을 새로 읽어도 유지하며 최신순으로 조회한다',()=>{
 let raw=null;
 const storage={getItem:()=>raw,setItem:(_,value)=>{raw=value;}};
 const a={...prepareEntry('','첫 글'),createdAt:1};
 const b={...prepareEntry('별','두 번째 글','이안'),createdAt:2};
 saveEntry(storage,a);saveEntry(storage,b);
 assert.deepEqual(readEntries(storage).map(x=>x.message),['두 번째 글','첫 글']);
 assert.equal(readEntries(storage)[0].idol,'이안');
});
test('손상된 저장 자료를 조용히 덮어쓰지 않으며 저장 실패를 전달한다',()=>{
 const storage={getItem:()=>'{invalid',setItem:()=>assert.fail('덮어쓰면 안 됨')};
 assert.throws(()=>saveEntry(storage,prepareEntry('','기록')));
 assert.throws(()=>saveEntry({getItem:()=>null,setItem:()=>{throw new Error('quota');}},prepareEntry('','기록')));
});
