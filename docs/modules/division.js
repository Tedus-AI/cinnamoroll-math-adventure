export function seeded(seed) {let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function divisionSteps(a,b) {
 const ds=String(a).split("").map(Number); const out=[];let remain=0,started=false;
 for(let i=0;i<ds.length;i++){const value=remain*10+ds[i];const q=Math.floor(value/b);
 if(!started&&q===0&&i<ds.length-1){remain=value;continue;}
 started=true; const product=q*b;remain=value-product;
 out.push({column:i,value,q,product,remainder:remain,next:ds[i+1]??null});
 }return out;
}
export function generateDivision(tier=3,rng=Math.random) {
 const digits=tier===1?2:tier===2?3:4;
 const low=10**(digits-1),high=10**digits-1;
 for(let i=0;i<3000;i++){
 const b=10+Math.floor(rng()*(tier===3?30:90));
 const a=low+Math.floor(rng()*(high-low+1));
 if(a<b)continue;const q=Math.floor(a/b),r=a%b;
 if(tier===1&&q>5&&rng()<.5)continue;
 if(tier===3&&q<10)continue;
 if(tier>=5&&i<200&&rng()<.7&&!String(q).slice(1).includes("0"))continue;
 return {a,b,q,r,id:"d"+a+"-"+b+"-"+Math.floor(rng()*1e9),topic:"division",digits,tier,steps:divisionSteps(a,b)};
 }throw new Error("無法產生題目");
}
