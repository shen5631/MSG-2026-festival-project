import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareEntry, parseEntries } from '../src/guestbook/storage.ts';
test('빈 닉네임은 익명으로 표시하고 공백 메시지와 글자 수 초과는 거부한다',()=>{
 assert.equal(prepareEntry('  ',' 응원해요! ').nickname,'익명');
 assert.equal(prepareEntry('별',' 응원해요! ').message,'응원해요!');
 for(const message of ['  ','a'.repeat(151)]) assert.throws(()=>prepareEntry('',message));
 assert.throws(()=>prepareEntry('a'.repeat(21),'안녕'));
});
test('DB에서 받은 글을 최신순으로 정렬하고 최애 이름을 유지한다',()=>{
 const a={...prepareEntry('','첫 글'),createdAt:1};
 const b={...prepareEntry('별','두 번째 글','이안'),createdAt:2};
 const rows=parseEntries({[a.id]:a,[b.id]:b});
 assert.deepEqual(rows.map(x=>x.message),['두 번째 글','첫 글']);
 assert.equal(rows[0].idol,'이안');
});
test('글이 없으면 빈 목록이고 형식이 틀린 항목은 건너뛴다',()=>{
 assert.deepEqual(parseEntries(null),[]);
 const ok=prepareEntry('','정상 글');
 assert.deepEqual(parseEntries({x:{message:'깨진 글'},y:null,[ok.id]:ok}).map(r=>r.message),['정상 글']);
});
test('목록이 아닌 자료는 오류로 전달한다',()=>{
 assert.throws(()=>parseEntries('깨짐'));
 assert.throws(()=>parseEntries([1,2]));
});
