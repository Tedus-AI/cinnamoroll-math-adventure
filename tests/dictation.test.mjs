import test from 'node:test';
import assert from 'node:assert/strict';
import {createDictation} from '../public/game/dictation.js';
test('dictation inserts editable Traditional Chinese text without duplicating results and releases the mic',()=>{
 let rec,active=false,changes=0;
 class Speech{constructor(){rec=this;}start(){}stop(){this.onend();}abort(){this.aborted=true;}}
 const target={value:'前後',selectionStart:1,selectionEnd:1,readOnly:false},button={setAttribute(){}},status={};
 const input=createDictation({target,button,status,Speech,onActive:v=>active=v,onInput:()=>changes++});
 input.toggle();assert.equal(rec.lang,'zh-TW');assert.equal(active,true);assert.equal(target.readOnly,true);
 rec.onresult({results:[[{transcript:'希望'}]]});rec.onresult({results:[[{transcript:'希望新增帽子'}]]});
 assert.equal(target.value,'前希望新增帽子後');assert.equal(changes,2);
 input.toggle();assert.equal(active,false);assert.equal(target.readOnly,false);assert.equal(input.active,false);
 input.toggle();input.close();assert.equal(rec.aborted,true);assert.equal(rec.onresult,null);assert.equal(active,false);
});
test('unsupported speech and denied permissions retain text with an actionable fallback',()=>{
 const target={value:'原草稿',focus(){this.focused=true;}},button={setAttribute(){}},status={};
 const unsupported=createDictation({target,button,status,Speech:null});unsupported.toggle();assert.equal(target.focused,true);assert.ok(status.textContent.includes('聽寫'));assert.equal(target.value,'原草稿');
 let rec;class Speech{constructor(){rec=this;}start(){this.onerror({error:'not-allowed'});}abort(){}}
 const denied=createDictation({target,button,status,Speech});denied.toggle();assert.equal(denied.active,false);assert.ok(status.textContent.includes('麥克風'));assert.equal(target.value,'原草稿');denied.close();
});
