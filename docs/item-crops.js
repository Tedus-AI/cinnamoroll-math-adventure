// Individually reviewed source-pixel rectangles. Do not divide these atlases into equal cells.
const groups=[
 ['collectibles-classic-v4',1254,1254,['cloud','rainbow','snow','moon','crown','tea','ribbon','master','star','flower','bow','hat','cupcake','balloon','shell','book'],[
 [0,60,317,265],[320,60,320,265],[640,0,303,328],[950,25,304,300],
 [0,330,315,290],[315,330,325,290],[640,345,303,280],[950,330,304,295],
 [0,640,320,268],[330,645,300,258],[630,650,313,250],[945,650,309,250],
 [0,910,315,344],[325,900,310,354],[635,920,305,334],[940,905,314,349]]],
 ['collectibles-new-v4',1448,1086,['beret','straw-hat','star-glasses','scarf','pearl-necklace','heart-brooch','wand','camera','icecream','headphones','backpack','flower-basket'],[
 [0,50,360,305],[365,45,365,320],[730,90,405,245],[1135,0,313,365],
 [0,365,355,340],[370,375,350,325],[730,365,350,350],[1090,380,358,325],
 [0,705,330,381],[350,700,380,386],[735,715,355,371],[1090,710,358,376]]],
 ['room-props-v4',1774,887,['cloud-sofa','rainbow-lamp','tea-table','star-pillow','flower-pot','music-box','cloud-swing','moon-window'],[
 [0,78,515,365],[515,0,363,443],[880,30,450,410],[1340,0,434,443],
 [0,445,475,442],[475,445,390,442],[865,440,485,447],[1350,445,424,442]]]
];
export const ITEM_CROPS=Object.fromEntries(groups.flatMap(([file,width,height,ids,rects])=>ids.map((id,i)=>[id,{file,width,height,rect:rects[i]}])));
export const APPAREL_IDS=['hat-starlight','hat-bonnet','hat-nightcap','outfit-sailor','outfit-apron','outfit-cape'];
export function croppedItem(id){
 const clothes={'outfit-sailor':[82,175,1090,870],'outfit-apron':[45,135,1165,1025],'outfit-cape':[46,304,1163,651]};
 if(clothes[id])return '<svg width="100" height="100" viewBox="'+clothes[id].join(' ')+'" preserveAspectRatio="none" overflow="hidden"><image href="./assets/'+id+'.png" width="1254" height="1254"/></svg>';
 if(APPAREL_IDS.includes(id))return '<image href="./assets/'+id+'.png" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>';
 const c=ITEM_CROPS[id];if(!c)return null;
 const [x,y,w,h]=c.rect;
 return '<svg x="4" y="4" width="92" height="92" viewBox="'+c.rect.join(' ')+'" preserveAspectRatio="xMidYMid meet" overflow="hidden"><svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+c.rect.join(' ')+'" overflow="hidden"><image href="./assets/'+c.file+'.png" width="'+c.width+'" height="'+c.height+'"/></svg></svg>';
}
