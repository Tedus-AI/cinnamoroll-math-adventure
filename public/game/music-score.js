// Original looping compositions. Values are semitones above the tonic.
const make=(name,root,bpm,melody,chords,timbre='sine',boss=false)=>({name,root,bpm,melody,chords,timbre,boss});
export const MUSIC={
 home:make('雲朵的邀請',60,88,[12,16,19,16,21,19,16,14,12,16,19,24,23,19,16,null,17,21,24,21,19,16,14,12,14,17,19,23,24,null,19,null],[0,9,5,7]),
 dressing:make('小屋裡的午后',65,76,[12,16,19,null,21,19,16,null,14,17,21,19,16,14,12,null,12,19,24,23,21,19,17,16,14,17,19,null,16,14,12,null],[0,5,2,7]),
 practice:make('鉛筆與星星',62,82,[12,14,16,19,16,14,12,null,16,17,19,21,19,17,16,null,17,19,21,24,21,19,17,null,16,14,12,14,16,null,12,null],[0,9,5,7]),
 'world-0':make('微風草原',60,94,[12,16,19,21,19,16,14,12,16,19,24,21,19,null,16,null,17,21,19,17,16,14,12,14,16,19,17,14,12,null,12,null],[0,5,9,7]),
 'world-1':make('奶油樹的圓舞曲',65,102,[12,17,16,12,19,17,16,null,21,19,17,16,14,16,12,null,17,21,24,21,19,17,16,14,12,16,19,17,16,14,12,null],[0,2,5,7],'triangle'),
 'world-2':make('彩虹港的船歌',67,110,[12,19,16,19,21,19,14,16,12,19,24,23,21,null,19,null,17,21,19,16,14,19,17,14,12,16,19,21,19,16,12,null],[0,7,9,5]),
 'world-3':make('雪花八音盒',69,72,[24,23,19,null,21,19,16,null,17,16,14,12,14,19,16,null,24,19,21,23,24,21,19,16,17,14,16,19,12,null,12,null],[0,9,5,7]),
 'world-4':make('月光迴廊',62,78,[12,15,19,22,19,15,14,12,19,22,24,26,24,null,22,null,20,19,17,15,14,17,19,22,19,15,14,10,12,null,12,null],[0,8,5,7],'triangle'),
 'world-5':make('天空加冕禮',64,104,[12,19,24,23,21,19,16,19,24,28,26,24,23,19,16,null,17,21,24,26,28,26,24,21,19,23,26,23,24,null,24,null],[0,5,9,7]),
 'boss-0':make('雲球大挑戰',60,124,[12,12,15,19,17,15,12,10,12,19,22,19,17,15,14,10],[0,8,5,7],'triangle',true),
 'boss-1':make('藤蔓追逐曲',65,132,[12,15,17,15,19,17,15,12,20,19,17,15,14,17,19,10],[0,5,8,7],'triangle',true),
 'boss-2':make('烏雲海上戰',67,138,[12,19,12,22,19,17,15,10,12,15,19,24,22,19,17,14],[0,10,8,7],'triangle',true),
 'boss-3':make('冰晶的試煉',69,116,[24,19,22,17,19,15,17,14,12,15,19,22,24,22,19,10],[0,8,3,7],'triangle',true),
 'boss-4':make('迷霧魔法陣',62,128,[12,13,19,20,19,13,12,10,15,17,20,19,17,15,13,10],[0,1,8,7],'triangle',true),
 'boss-5':make('勇者與黑雲',64,144,[12,19,24,19,22,17,20,15,12,15,19,22,24,26,27,22],[0,8,5,7],'triangle',true)
};
// Distinct arrangements: flute meadow, harp waltz, syncopated harbor,
// sparse snow bells, slow moon strings, and a royal fanfare.
const arrangements=[
 {instrument:'flute',beats:8,swing:0,notes:[1,1,0,1,1,0,1,0],arp:[0,7,12,7],length:1.8},
 {instrument:'harp',beats:6,swing:0,notes:[1,0,1,1,0,1],arp:[0,4,7],length:1.2},
 {instrument:'steel',beats:8,swing:.18,notes:[1,0,1,1,0,1,0,1],arp:[0,7,4,12],length:.85},
 {instrument:'bell',beats:8,swing:0,notes:[1,0,0,1,0,0,1,0],arp:[12,7,16,7],length:3.4},
 {instrument:'strings',beats:8,swing:0,notes:[1,0,1,0,1,1,0,0],arp:[0,3,7,10],length:3},
 {instrument:'brass',beats:8,swing:.08,notes:[1,1,0,1,1,1,1,0],arp:[0,7,12,16],length:1.3}
];
for(let w=0;w<6;w++){
 Object.assign(MUSIC['world-'+w],arrangements[w]);
 Object.assign(MUSIC['boss-'+w],arrangements[w],{beats:8,notes:[1,1,1,0,1,1,0,1],length:.8,swing:0});
}
const roomScores={
 'scene-bedroom':{...make('雲朵臥室・星星搖籃曲',60,64,[19,null,16,12,14,null,16,null,19,21,19,null,16,14,12,null],[0,5,9,7]),instrument:'bell',beats:8,notes:[1,0,1,1,1,0,1,0],arp:[0,7,12,7],length:3,swing:0},
 'scene-cafe':{...make('甜點咖啡館・奶油午茶',65,102,[12,16,null,19,21,19,null,16,14,17,21,null,19,16,14,12],[0,9,2,7]),instrument:'harp',beats:8,notes:[1,1,0,1,1,1,0,1],arp:[0,4,7,11],length:1.1,swing:.2},
 'scene-beach':{...make('彩虹海灘・浪花假期',67,112,[19,12,16,null,19,21,24,null,23,19,16,14,12,null,19,null],[0,5,7,0]),instrument:'steel',beats:8,notes:[1,1,1,0,1,1,1,0],arp:[0,7,4,12],length:1.1,swing:.12},
 'scene-garden':{...make('星光花園・花瓣圓舞曲',62,90,[12,16,19,21,19,null,17,21,24,26,24,null,19,17,16,14,12,null],[0,5,9,7]),instrument:'flute',beats:6,notes:[1,1,1,1,1,0],arp:[0,4,7],length:1.9,swing:0},
 'scene-castle':{...make('月光城堡・銀月小夜曲',69,76,[12,null,15,19,22,null,24,22,20,19,17,null,15,14,12,null],[0,8,5,7]),instrument:'strings',beats:8,notes:[1,0,1,1,1,0,1,1],arp:[0,3,7,10],length:3,swing:0}
};
const towerSongs=[['aurora','極光雲端觀測台・極光慢舞',64,70,'strings',[12,19,24,null,22,19,17,null]],['blossom','櫻花流水庭園・櫻雨小徑',65,94,'flute',[12,16,19,21,19,17,16,null]],['meteor','流星祈願露台・流星心願',69,78,'bell',[24,null,19,22,null,17,19,null]],['lagoon','彩虹水晶潟湖・水晶漣漪',67,106,'steel',[12,19,16,null,21,24,19,16]],['palace','天界星光宮殿・天界星冠',60,88,'harp',[12,19,24,28,26,24,19,null]]];
for(const [id,name,root,bpm,instrument,melody] of towerSongs)roomScores['scene-tower-'+id]={...make(name,root,bpm,melody,[0,5,9,7]),instrument,beats:8,notes:[1,1,0,1,1,0,1,0],arp:[0,7,12,16],length:2.5,swing:0};
for(const [scene,score] of Object.entries(roomScores))MUSIC['room-'+scene]=score;
export function musicTrack(view,world=0,boss=false,scene='scene-bedroom'){
 if(view==='dressing')return 'room-'+(Object.hasOwn(roomScores,scene)?scene:'scene-bedroom');
 if(view==='practice')return 'practice';
 if(view==='world'||view==='play')return (boss?'boss-':'world-')+Math.max(0,Math.min(5,Number(world)||0));
 return 'home';
}
