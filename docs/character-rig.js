import {isIOS,tabletMode} from './platform.js';
// The original PNG is the only character artwork. A textured mesh deforms its
// eyes, mouth, ears and limbs without redrawing or replacing the silhouette.
import {SKINS} from './progression.js';
import {fitAttachments} from './character-fit.js';
const SOURCE='./assets/cinnamoroll-poses.png';
export const MOTION_POSES={breathe:0,peek:0,hop:3,float:1,sleep:5,dance:3,cheer:3};
export function applyMotionPose(rig,name){
 const pose=MOTION_POSES[name]??0,art=rig.querySelector('.original-character');
 if(art)art.setAttribute('viewBox',(pose%3*512)+' '+(Math.floor(pose/3)*512)+' 512 512');
 const character=rig.querySelector('.character-live');if(character){character.dataset.sourcePose=String(pose);character.dataset.motion=name;fitAttachments(character,pose);}
 const canvas=rig.querySelector('canvas');active.get(canvas)?.draw(performance.now());
}
const vertexSource=[
'attribute vec2 aPosition;',
'uniform mediump float uTime; uniform float uMotion; uniform float uPose;',
'varying vec2 vUV;',
'float region(vec2 p,vec2 center,vec2 radius){return 1.0-smoothstep(0.45,1.0,length((p-center)/radius));}',
'vec2 rotateAt(vec2 p,vec2 pivot,float angle){float c=cos(angle),s=sin(angle);vec2 d=p-pivot;return pivot+vec2(d.x*c-d.y*s,d.x*s+d.y*c);}',
'void main(){',
' vec2 p=aPosition;',
' float t=uTime; float sleepMode=step(3.5,uMotion)*(1.0-step(4.5,uMotion));',
' float dance=step(4.5,uMotion); float cheer=step(5.5,uMotion); float fly=step(2.5,uMotion)*(1.0-step(3.5,uMotion));',
' float hop=step(1.5,uMotion)*(1.0-step(2.5,uMotion));',
' float peek=step(.5,uMotion)*(1.0-step(1.5,uMotion));',
' float pose=uPose;',
' vUV=(clamp(aPosition,vec2(.5),vec2(511.5))+vec2(mod(pose,3.0)*512.0,floor(pose/3.0)*512.0))/vec2(1536.0,1024.0);',
' if(sleepMode>.5){',
'  float head=region(p,vec2(220.0,230.0),vec2(153.0,110.0));',
'  p=mix(p,rotateAt(p,vec2(240.0,305.0),.025+.018*sin(t*1.2)),head);',
'  p.y+=head*(2.0+2.0*sin(t*1.2));',
'  float ears=1.0-region(aPosition,vec2(225.0,250.0),vec2(145.0,100.0));',
'  p.y+=ears*1.4*sin(t*1.2-.6);',
' }else if(fly>.5){',
'  float left=1.0-smoothstep(155.0,220.0,aPosition.x);',
'  float right=smoothstep(363.0,418.0,aPosition.x);',
'  p=mix(p,rotateAt(p,vec2(207.0,222.0),.13*sin(t*5.5)),left);',
'  p=mix(p,rotateAt(p,vec2(378.0,213.0),-.13*sin(t*5.5)),right);',
'  float belly=region(aPosition,vec2(258.0,368.0),vec2(98.0,66.0));',
'  p.y+=belly*3.0*sin(t*3.0);',
' }else if(max(hop,dance)>.5){',
'  float left=1.0-smoothstep(130.0,172.0,aPosition.x),right=smoothstep(363.0,408.0,aPosition.x);',
'  float flap=(.11+.08*cheer)*sin(t*(4.0+3.0*cheer));',
'  p=mix(p,rotateAt(p,vec2(150.0,191.0),flap),left);',
'  p=mix(p,rotateAt(p,vec2(372.0,185.0),-flap),right);',
'  float leftHand=region(aPosition,vec2(167.0,269.0),vec2(47.0,49.0));',
'  float rightHand=region(aPosition,vec2(350.0,265.0),vec2(46.0,47.0));',
'  p=mix(p,rotateAt(p,vec2(208.0,289.0),.17*sin(t*(3.0+4.0*cheer))),leftHand);',
'  p=mix(p,rotateAt(p,vec2(309.0,287.0),-.17*sin(t*(3.0+4.0*cheer)+dance*1.5)),rightHand);',
'  float leftFoot=region(aPosition,vec2(210.0,385.0),vec2(34.0,31.0)),rightFoot=region(aPosition,vec2(294.0,385.0),vec2(34.0,31.0));',
'  float kick=7.0*sin(t*4.0);',
'  p.y-=dance*(leftFoot*max(0.0,kick)+rightFoot*max(0.0,-kick));',
'  p.y+=hop*4.0*sin(t*3.0)*(leftFoot+rightFoot);',
'  float mouth=region(aPosition,vec2(259.0,221.0),vec2(32.0,29.0));',
'  p.y+=(aPosition.y-208.0)*(-.2+.15*sin(t*4.0))*mouth;',
' }else{',
' float phase=mod(t,5.6); float blink=1.0-.96*exp(-pow((phase-2.0)*11.0,2.0));',
' blink=mix(blink,.06,sleepMode);',
' float eyeL=region(p,vec2(195.0,248.0),vec2(29.0,33.0));',
' float eyeR=region(p,vec2(327.0,236.0),vec2(28.0,33.0));',
' p.y+=(aPosition.y-248.0)*(blink-1.0)*eyeL;',
' p.y+=(aPosition.y-236.0)*(blink-1.0)*eyeR;',
' float mouth=region(aPosition,vec2(262.0,268.0),vec2(33.0,31.0));',
' float talk=.55+.43*(.5+.5*sin(t*3.2));',
' p.y+=(aPosition.y-256.0)*(talk-1.0)*mouth;',
' float body=region(aPosition,vec2(262.0,366.0),vec2(90.0,80.0));',
' p.x+=(aPosition.x-262.0)*.012*sin(t*1.8)*body;',
' p.y-=(aPosition.y-413.0)*.025*sin(t*1.8)*body;',
' float leftEar=(1.0-smoothstep(138.0,178.0,aPosition.x))*(1.0-smoothstep(305.0,337.0,aPosition.y));',
' float rightEar=smoothstep(344.0,390.0,aPosition.x)*(1.0-smoothstep(304.0,332.0,aPosition.y));',
' float earAngle=(.065+.12*fly+.05*dance)*sin(t*(1.8+3.5*fly+1.5*dance));',
' p=mix(p,rotateAt(p,vec2(159.0,224.0),earAngle),leftEar);',
' p=mix(p,rotateAt(p,vec2(367.0,220.0),-earAngle),rightEar);',
' float leftArm=region(aPosition,vec2(177.0,340.0),vec2(37.0,33.0));',
' float rightArm=region(aPosition,vec2(339.0,294.0),vec2(42.0,39.0));',
' float wave=(.09+.20*dance)*sin(t*(2.2+2.0*dance));',
' p=mix(p,rotateAt(p,vec2(205.0,319.0),wave),leftArm);',
' p=mix(p,rotateAt(p,vec2(306.0,319.0),-wave),rightArm);',
' float leftFoot=region(aPosition,vec2(220.0,417.0),vec2(31.0,30.0));',
' float rightFoot=region(aPosition,vec2(300.0,416.0),vec2(31.0,30.0));',
' float kick=(1.3+4.0*dance+3.0*hop)*sin(t*(2.5+2.0*dance));',
' p.y-=max(0.0,kick)*leftFoot+max(0.0,-kick)*rightFoot;',
' float head=1.0-smoothstep(292.0,334.0,aPosition.y);',
' float nod=(.018+.11*peek)*sin(t*1.25);',
' p=mix(p,rotateAt(p,vec2(260.0,307.0),nod),head);',
' p.x+=head*peek*7.0*sin(t*1.25);',
' p.x+=peek*3.5*sin(t*1.25)*(eyeL+eyeR);',
' }',
' gl_Position=vec4((p.x+64.0)/320.0-1.0,1.0-(p.y+64.0)/320.0,0.0,1.0);',
'}'
].join('\n');
const fragmentSource='precision mediump float; uniform sampler2D uImage; uniform vec3 uTint; uniform float uRainbow; uniform float uTime; varying vec2 vUV; void main(){vec4 c=texture2D(uImage,vUV);float light=min(c.r,min(c.g,c.b));float white=smoothstep(.55,.95,light);vec3 rainbow=.77+.23*cos(6.28318*(vUV.x*2.0+vUV.y*.7+uTime*.025+vec3(0.0,.33,.67)));vec3 tint=mix(uTint,rainbow,uRainbow);c.rgb=mix(c.rgb,c.rgb*tint,white);gl_FragColor=vec4(c.rgb*c.a,c.a);}';
const active=new Map();
let imagePromise,frame=null,lastFrame=0;
function imageReady(){
 if(!imagePromise)imagePromise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=SOURCE;});
 return imagePromise;
}
function shader(gl,type,source){
 const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Character shader unavailable');}return s;
}
function createRenderer(canvas,img){
 // On touch devices, present through a transparent 2D canvas to avoid Safari WebGL layer compositing artifacts.
 const surface=(isIOS||tabletMode())?document.createElement('canvas'):canvas;
 const presentation=surface!==canvas?canvas.getContext('2d',{alpha:true}):null;
 const gl=surface.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:false});
 if(!gl)return null;
 const program=gl.createProgram(),vs=shader(gl,gl.VERTEX_SHADER,vertexSource),fs=shader(gl,gl.FRAGMENT_SHADER,fragmentSource);
 gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Character animation unavailable');
 gl.useProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
 // 65 x 65 vertices keep a blink smooth while all untouched pixels keep their UVs.
 const n=64,points=[],indices=[];
 for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)points.push(x*512/n,y*512/n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x,b=a+1,c=a+n+1,d=c+1;indices.push(a,b,c,b,d,c);}
 const vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
 gl.uniform1i(gl.getUniformLocation(program,'uImage'),0);gl.clearColor(0,0,0,0);
 const time=gl.getUniformLocation(program,'uTime'),motion=gl.getUniformLocation(program,'uMotion'),poseUniform=gl.getUniformLocation(program,'uPose');
 const parent=canvas.parentElement,skin=SKINS.find(s=>s.id===parent.dataset.skin);let lastName='',started=0;
 gl.uniform3fv(gl.getUniformLocation(program,'uTint'),skin?.rgb||[1,1,1]);gl.uniform1f(gl.getUniformLocation(program,'uRainbow'),skin?.rainbow?1:0);
 surface.addEventListener('webglcontextlost',()=>{parent.classList.remove('rig-ready');active.delete(canvas);},{once:true});
 surface.addEventListener('webglcontextrestored',()=>{canvas.dataset.mounted='';mountCharacters(parent);},{once:true});
 return {
  draw(ms){
   if(parent.closest('.editing-appearance'))return;
   const bounds=canvas.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight||bounds.width===0)return;
   const size=Math.min(presentation?640:900,Math.max(128,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,2))));
   if(canvas.width!==size){canvas.width=size;canvas.height=size;surface.width=size;surface.height=size;gl.viewport(0,0,size,size);}
   const rig=canvas.closest('.doll-rig'),basePose=Number(parent.dataset.pose)||0;
   const name=rig?.dataset.motion||['breathe','float','peek','cheer','breathe','sleep'][basePose];
   const pose=rig?MOTION_POSES[name]??0:basePose;
   if(name!==lastName){lastName=name;started=ms;}
   const kind=['breathe','peek','hop','float','sleep','dance','cheer'].indexOf(name);
   gl.uniform1f(time,(ms-started)/1000);gl.uniform1f(motion,Math.max(0,kind));gl.uniform1f(poseUniform,pose);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
   if(presentation){presentation.clearRect(0,0,size,size);presentation.drawImage(surface,0,0);}
   fitAttachments(parent,pose,(ms-started)/1000,name);
   parent.classList.add('rig-ready');parent.dataset.motion=name;canvas.dataset.motion=name;
  },
  dispose(){gl.deleteTexture(texture);gl.deleteBuffer(vertexBuffer);gl.deleteBuffer(indexBuffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
 };
}
function tick(ms){
 frame=null;
 if(ms-lastFrame>32){
  lastFrame=ms;
  for(const [canvas,renderer] of active){
   if(!canvas.isConnected){renderer.dispose();active.delete(canvas);}
   else if(!document.hidden)renderer.draw(ms);
  }
 }
 if(active.size)frame=requestAnimationFrame(tick);
}
export async function mountCharacters(root=document){
 // Reduced-motion and unavailable WebGL retain the unaltered original PNG.
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const canvases=[...root.querySelectorAll('canvas[data-original-rig]:not([data-mounted="true"])')];
 if(!canvases.length)return;
 for(const c of canvases)c.dataset.mounted='true';
 try{
  const img=await imageReady();
  for(const c of canvases){if(!c.isConnected)continue;const renderer=createRenderer(c,img);if(renderer){active.set(c,renderer);renderer.draw(performance.now());}}
  if(active.size&&!frame)frame=requestAnimationFrame(tick);
 }catch{/* Preserve the original artwork if graphics are unavailable. */}
}
