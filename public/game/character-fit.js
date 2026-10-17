// Coordinates are percentages of the original 512px pose, not the room.
const neutral={head:[51,27,37,31],ear:[74,43,13,13],eyes:[51,47,33,20],neck:[51,62,20,13],chest:[51,69,11,11],hand:[67,60,21,21],back:[64,71,23,27],outfit:[51,71,27,21]};
const fits=[
 neutral,
 {...neutral,head:[57,33,36,29],ear:[83,35,12,12],eyes:[58,53,32,19],neck:[54,66,20,13],chest:[51,71,10,10],hand:[67,65,20,20],outfit:[50,73,29,21]},
 {...neutral,head:[58,30,37,31],eyes:[58,49,32,20],outfit:[49,73,28,24],neck:[53,65,20,13]},
 {...neutral,head:[51,19,37,31],ear:[75,35,13,13],eyes:[51,39,33,20],neck:[51,55,20,13],chest:[51,63,11,11],hand:[70,51,21,21],outfit:[50,64,29,25]},
 {...neutral,head:[49,26,37,31],eyes:[48,49,32,20],neck:[49,63,20,13],outfit:[49,70,28,24]},
 {...neutral,head:[44,27,37,29],ear:[77,50,13,13],eyes:[43,50,33,19],neck:[53,59,18,9],chest:[56,58,10,8],hand:[48,62,18,18],back:[66,52,23,18],outfit:[60,59,17,8]}
];
export function fitFor(slot,pose=0,id=''){
 const v=[...(fits[pose]||neutral)[slot]||[]];if(!v.length)return null;
 if(id==='headphones'){v[1]+=12;v[2]=46;v[3]=44;}
 if(id==='hat-bonnet'){v[1]+=6;v[2]=50;v[3]=43;}
 if(id==='hat-starlight'){v[1]-=4;v[3]=37;}
 if(id==='hat-nightcap'){v[1]-=1;v[2]=43;}
 if(id==='outfit-cape'){v[2]+=4;}
 return v;
}
export function fitAttachments(parent,pose,t=0,motion=''){
 for(const el of parent.querySelectorAll('[data-wear-slot]')){
  const slot=el.dataset.wearSlot,p=fitFor(slot,pose,el.dataset.wearItem);if(!p)continue;
  const head=['head','ear','eyes'].includes(slot),nod=head&&pose===0?(.018+(motion==='peek'?.11:0))*Math.sin(t*1.25):0;
  let [x,y,w,h]=p;
  if(nod){const dx=x-50.8,dy=y-60;x=50.8+dx*Math.cos(nod)-dy*Math.sin(nod);y=60+dx*Math.sin(nod)+dy*Math.cos(nod);if(motion==='peek')x+=1.37*Math.sin(t*1.25);}
  const breath=slot==='outfit'&&pose===0?.5*Math.sin(t*1.8):0;
  el.style.left=x+'%';el.style.top=(y-breath)+'%';el.style.width=w+'%';el.style.height=(h+breath)+'%';
  el.style.transform='translate(-50%,-50%) rotate('+(nod*180/Math.PI+(pose===1&&slot==='outfit'?-14:pose===5&&slot==='outfit'?12:0))+'deg) scale(var(--wear-scale,1))';
 }
}
