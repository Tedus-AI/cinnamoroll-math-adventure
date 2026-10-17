export const MIN_SCALE=.05;
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
// Project the pointer onto the selected corner's diagonal, keeping aspect ratio.
// Crossing the opposite corner clamps at minimum size instead of growing again.
export function cornerScale(scale,corner,dx,dy,width,height,max){
 const sx=corner.includes('e')?1:-1,sy=corner.includes('s')?1:-1;
 const ratio=1+(sx*dx*width+sy*dy*height)/(width*width+height*height);
 return clamp(scale*ratio,MIN_SCALE,max);
}
export function boundProp(p,width,height){
 const halfX=14*p.scale,halfY=halfX*width/height;
 return {...p,x:clamp(p.x,Math.min(50,halfX),Math.max(50,100-halfX)),y:clamp(p.y,Math.min(50,halfY),Math.max(50,100-halfY))};
}
export function resizeProp(p,corner,dx,dy,width,height){
 const sx=corner.includes('e')?1:-1,sy=corner.includes('s')?1:-1;
 const size=.28*p.scale*width,anchorX=p.x/100*width-sx*size/2,anchorY=p.y/100*height-sy*size/2;
 const available=Math.min(sx>0?width-anchorX:anchorX,sy>0?height-anchorY:anchorY);
 const maximum=Math.max(MIN_SCALE,Math.min(1.6,available/(.28*width)));
 const scale=cornerScale(p.scale,corner,dx,dy,size,size,maximum),nextSize=.28*scale*width;
 return {...p,scale,x:(anchorX+sx*nextSize/2)/width*100,y:(anchorY+sy*nextSize/2)/height*100};
}
