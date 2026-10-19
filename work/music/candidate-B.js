/*MUSIC_B candidate B:leitmotif+pulse score. Pure planner runs in Node;seeded PRNG only.*/
(function(root){
 'use strict';
 var TAU=Math.PI*2,DUCK_DB=-5,DUCK_ATK=0.2,DUCK_REL=0.4,TAIL=1.5,LOOK=0.3,QUANT=0.06;

 function hash32(s){s=String(s);var h=2166136261>>>0;for(var i=0;i<s.length;i++){h ^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
 function prng(seed){var a=hash32(seed);return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t ^(t>>>15),t|1);t ^=t+Math.imul(t ^(t>>>7),t|61);return((t ^(t>>>14))>>>0)/4294967296;};}
 function pick(r,arr){return arr[Math.floor(r()*arr.length)% arr.length];}
 function clamp(x,a,b){return x<a?a:x>b?b:x;}
 function r3(x){return Math.round(x*1000)/1000;}
 function mtof(m){return 440*Math.pow(2,(m-69)/12);}
 var NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
 function mname(m){return NAMES[((m % 12)+12)% 12]+(Math.floor(m/12)-1);}
 function hexRgb(h){h=String(h||'#888').replace('#','');if(h.length===3)h=h.replace(/./g,function(c){return c+c;});var n=parseInt(h,16)||0;return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
 function hsl(hex){var c=hexRgb(hex),r=c[0],g=c[1],b=c[2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0,l=(mx+mn)/2,s=d===0?0:d/(1-Math.abs(2*l-1));if(d>0){h=mx===r?((g-b)/d)% 6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)% 360;}return{h:h,s:s,l:l};}

 var SIG={
   cetacean:{iv:[7,5,-2,12,-7],rh:[2,2,1,3]},
   avian:{iv:[4,3,5,2,-12],rh:[1,1,1,2]},
   submersible:{iv:[-2,-3,2,-5,0],rh:[2,2,4,2]},
   geometric:{iv:[5,5,-10,5,2],rh:[1,1,2,2]},
   instrument:{iv:[2,2,3,-2,2],rh:[1,1,1,1]},
   calligraphic:{iv:[1,2,-1,-2,3],rh:[1,0.5,0.5,2]},
   mythic:{iv:[6,1,4,-11,7],rh:[3,1,2,2]},
   botanical:{iv:[3,2,2,3,-10],rh:[1,2,1,2]}
};
 var LOOPS={
   warm:{mode:'major',scale:[0,2,4,5,7,9,11],prog:[[0,'maj','I'],[7,'maj','V'],[9,'min','vi'],[5,'maj','IV']]},
   cool:{mode:'minor',scale:[0,2,3,5,7,8,10],prog:[[0,'min','i'],[8,'maj','VI'],[3,'maj','III'],[10,'maj','VII']]},
   luminous:{mode:'lydian',scale:[0,2,4,6,7,9,11],prog:[[0,'maj','I'],[2,'maj','II'],[5,'maj','IV'],[0,'maj','I']]}
};
 var ROOTS=[48,50,52,53,55,57,59,60];
 var TEMPO={beat:120,saul:120,spring:112,glaser:104,rostrum:75,rest:96,held:90,slow:60};
 var ROLE={
   hook:{tr:'state',dens:1,reg:0,acc:0.85,pulse:'basic',mood:'statement'},
   threshold:{tr:'transpose',dens:1,reg:0,acc:0.7,pulse:'basic',mood:'curious'},
   escalation:{tr:'invert',dens:1.5,reg:0,acc:0.8,pulse:'drive',mood:'rising'},
   turn:{tr:'invert',dens:1,reg:-12,acc:0.9,pulse:'basic',mood:'pivot'},
   filter:{tr:'fragment',dens:0.5,reg:12,acc:0.6,pulse:'sparse',mood:'sift'},
   breather:{tr:'rest',dens:0,reg:12,acc:0.4,pulse:'off',mood:'breath'},
   climax:{tr:'octave',dens:2,reg:12,acc:1.0,pulse:'drive',mood:'peak'},
   callback:{tr:'augment',dens:0.5,reg:0,acc:0.75,pulse:'tail',mood:'landing'}
};
 var SFX_LEN={WHOOSH:0.32,THUD:0.3,CLICK:0.03,BOOP:0.14,BOING:0.5,CHORD:1.35};

 function temperatureOf(pal){
   var p=pal||{},sw=[p.a,p.h,p.b].filter(Boolean),warm=0,lum=0,n=0;
   sw.forEach(function(hx){var c=hsl(hx);var w=(c.h<70||c.h>330)?1:(c.h>150&&c.h<270)?-1:0;warm+=w*(0.3+c.s);lum+=c.l;n++;});
   var mood=String(p.mood||'');
   if(/warm|sienna|cinnamon|ochre|russet/i.test(mood))warm+=0.6;
   if(/cool|cold|clinical|calm|slate|ice/i.test(mood))warm-=0.6;
   var L=n?lum/n:0.5;
   if(L>0.66&&(/pale|light|bright|luminous|ivory|airy|ecru/i.test(mood)||warm>-0.3))return 'luminous';
   return warm>=0?'warm':'cool';
}
 function snapToScale(rel,scale){var pc=((rel % 12)+12)% 12,best=0,bd=99;for(var i=0;i<scale.length;i++){var d=Math.min(Math.abs(scale[i]-pc),12-Math.abs(scale[i]-pc));if(d<bd){bd=d;best=scale[i];}}var o=rel-pc;var out=o+best;if(best-pc>6)out-=12;if(pc-best>6)out+=12;return out;}
 function chordTones(rootPc,q){return [rootPc,rootPc+(q==='min'?3:4),rootPc+7].map(function(x){return x % 12;});}
 function voiceLead(pcs,prev,lo,hi){
   var best=null,bd=1e9;
   for(var inv=0;inv<3;inv++)for(var oct=-1;oct<=1;oct++){
     var v=[],base=lo+12*(oct+1);
     for(var k=0;k<3;k++){var pc=pcs[(k+inv)% 3];var m=base+pc;while(m<lo)m+=12;while(m>hi)m-=12;v.push(m);}
     v.sort(function(a,b){return a-b;});
     var cost=prev?v.reduce(function(s,m,i){return s+Math.abs(m-prev[i]);},0):Math.abs(v[0]-(lo+7));
     if(cost<bd){bd=cost;best=v;}
  }
   return best;
}

 function deriveBase(palette,feel,seed,archetype){
   var pal=palette||{},arch=SIG[archetype]?archetype:'cetacean',sig=SIG[arch];
   var palId=Number(pal.wadaIndex||pal.id||343)||343,temp=temperatureOf(pal),loop=LOOPS[temp];
   var feelId=(feel&&feel.id)||(typeof feel==='string'?feel:'glaser'),bpm=TEMPO[feelId]||100;
   var r=prng('motif|'+seed+'|'+arch+'|'+palId);
   var n=4+Math.floor(r()*5),rel=[0],durs=[pick(r,sig.rh)],cur=0;
   for(var i=1;i<n;i++){var step=pick(r,sig.iv);if(Math.abs(cur+step)>14)step=-step;cur=clamp(cur+step,-14,14);rel.push(cur);durs.push(pick(r,sig.rh));}
   if(rel[n-1]!==0&&n>=6){rel[n-1]=Math.abs(rel[n-1])<5?0:rel[n-1];}
   var root=ROOTS[palId % 8];
   return{seed:String(seed),archetype:arch,signature:sig.iv.slice(),temperature:temp,mode:loop.mode,scale:loop.scale,bpm:bpm,
     beatSec:60/bpm,key:{rootMidi:root,rootName:mname(root),mode:loop.mode},loop:loop.prog.map(function(c){return{rootPc:c[0],quality:c[1],name:c[2]};}),
     motif:{rel:rel,durs:durs,n:n},feel:feelId};
}
 function transformMotif(base,tr){
   var m=base.motif,rel=m.rel.slice(),durs=m.durs.slice(),f=1;
   if(tr==='invert')rel=rel.map(function(x){return-x;});
   if(tr==='octave')rel=rel.map(function(x){return x+12;});
   if(tr==='fragment'){var k=Math.ceil(rel.length/2);rel=rel.slice(0,k);durs=durs.slice(0,k);f=0.5;}
   if(tr==='augment'){f=2;rel.push(0);durs.push(2);}
   return{rel:rel,durs:durs,f:f};
}
 function roleFor(beat,i,count){
   var role=String(beat.role||'').toLowerCase();
   if(ROLE[role])return role;
   if(i===0)return 'hook';if(i===count-1)return 'callback';
   if(beat.cameraMove==='breather-hold'||(beat.activeSimultaneousMoves<=1&&i===count-2))return 'breather';
   return ['threshold','escalation','turn','filter','climax'][(i-1)% 5];
}
 function quantize(t,bpm){var g=15/bpm;var q=Math.round(t/g)*g;return Math.abs(q-t)<=QUANT?{t:r3(q),q:true}:{t:r3(t),q:false};}

 function scoreForBeat(beat,palette,feel,base,ctxOpts){
   var o=ctxOpts||{},b=beat||{},i=Number(b.index)||0,count=o.count||8;
   base=base||deriveBase(palette,feel,o.seed||b.seed||b.id||'ceti',o.archetype||b.archetype||'cetacean');
   var role=roleFor(b,i,count),R=ROLE[role],t0=Number(b.tStartSec)||0,t1=Number(b.tEndSec)||(t0+1.25),L=Math.max(0.3,t1-t0);
   var bs=base.beatSec,span=L/bs,chord=role==='callback'?base.loop[0]:base.loop[i % 4];
   var prev=o.prevVoicing||null,voicing=voiceLead(chordTones(chord.rootPc,chord.quality),prev,base.key.rootMidi-2,base.key.rootMidi+16);
   var tm=transformMotif(base,R.tr),notes=[],bells=[];
   var tot=tm.durs.reduce(function(s,d){return s+d;},0),minD=Math.min.apply(null,tm.durs);
   var f=tm.f*Math.pow(2,Math.floor(Math.log(span*0.92/tot)/Math.LN2));if(f*minD<0.25)f=0.25/minD;if(R.tr==='augment')f=Math.max(f,tm.f*0.5);
   var limit=R.tr==='augment'?span+TAIL/bs:span*0.98,pos=0,trOff=(R.tr==='transpose'||R.tr==='invert'||R.tr==='fragment')?chord.rootPc:0;
   if(R.tr!=='rest')for(var k=0;k<tm.rel.length;k++){
     var start=Math.round(pos*4)/4,d=tm.durs[k]*f;if(start>=limit)break;
     var midi=base.key.rootMidi+12+R.reg+snapToScale(trOff+tm.rel[k],base.scale);
     notes.push({t:r3(t0+start*bs),midi:midi,name:mname(midi),dur:r3(d*bs),vel:k===0?R.acc:0.55+0.1*((k % 2)?0:1)});
     pos+=d;
  }
   var phrase=base.motif.rel.slice(0,Math.min(4,base.motif.n)).map(function(x){return base.key.rootMidi+24+snapToScale(x,base.scale);});
   var bellAt=role==='hook'?t0+L*0.5:role==='callback'?t0:role==='breather'?t0+L*0.25:-1;
   if(bellAt>=0){var bp=role==='breather'?phrase.slice(0,3):phrase;bp.forEach(function(m,k){bells.push({t:r3(bellAt+k*bs*0.25),midi:m,dur:1.2,tag:role==='hook'?'plant':role==='callback'?'return':'echo'});});}
   var pulse=[],g0=Math.ceil(t0/bs-1e-6),g1=Math.floor((t1-1e-6)/bs);
   if(R.pulse!=='off')for(var q=g0;q<=g1;q++){
     var tq=r3(q*bs),half=(tq-t0)<L*0.5;
     var kick=R.pulse==='drive'||(R.pulse==='basic'&&q % 2===0)||(R.pulse==='sparse'&&q % 4===0)||(R.pulse==='tail'&&half&&q % 2===0);
     if(kick)pulse.push({t:tq,type:'kick',vel:R.acc});
     var hatDiv=R.dens>=2?4:R.dens>=1.5?2:R.pulse==='basic'?2:0;
     for(var h=1;h<hatDiv;h++)if(R.pulse!=='tail'||half)pulse.push({t:r3(tq+h*bs/hatDiv),type:'hat',vel:0.5});
  }
   return{index:i,id:b.id||('beat-'+(i+1)),role:role,tStart:t0,tEnd:t1,mood:R.mood,transform:R.tr,density:R.dens,register:R.reg,accent:R.acc,
     chord:{name:chord.name,root:mname(base.key.rootMidi+chord.rootPc),quality:chord.quality,midis:voicing},chordProgression:base.loop.map(function(c){return c.name;}),
     pad:{t:t0,dur:r3(L+(role==='callback'?TAIL:0.05)),midis:voicing},pulse:pulse,motif:notes,bell:bells,tail:role==='callback'?TAIL:0};
}

 function plan(storyboard,palette,seed){
   var sb=storyboard||{},beats=sb.beats||[],pal=palette||{};
   var charId=sb.charId||'ceti-whale',arch=sb.archetype||(root.STUDIO_CHARACTER_FOUNDRY&&root.STUDIO_CHARACTER_FOUNDRY.CHARACTERS&&root.STUDIO_CHARACTER_FOUNDRY.CHARACTERS[charId]||{}).archetype||guessArch(charId);
   var sd=String(seed!=null?seed:(sb.id||'sb')+'|'+charId+'|'+(pal.id||0));
   var base=deriveBase(pal,sb.feelKey||sb.feel||'glaser',sd,arch),cues=[],prev=null,events=[],sfx=[],cb={plantT:-1,returnT:-1,phrase:[]};
   beats.forEach(function(b,i){
     var cue=scoreForBeat(b,pal,base.feel,base,{count:beats.length,prevVoicing:prev});prev=cue.chord.midis;cues.push(cue);
     events.push({t:cue.pad.t,type:'pad',midis:cue.pad.midis,dur:cue.pad.dur,beat:i});
     cue.motif.forEach(function(n){events.push({t:n.t,type:'pluck',midi:n.midi,vel:n.vel,dur:n.dur,beat:i});});
     cue.bell.forEach(function(n){events.push({t:n.t,type:'bell',midi:n.midi,dur:n.dur,tag:n.tag,beat:i});if(n.tag==='plant'&&cb.plantT<0)cb.plantT=n.t;if(n.tag==='return'&&cb.returnT<0)cb.returnT=n.t;});
     if(cue.role==='hook')cb.phrase=cue.bell.map(function(n){return n.midi;});
     cue.pulse.forEach(function(p){events.push({t:p.t,type:p.type,vel:p.vel,beat:i});});
     var t0=cue.tStart,mid=Number(b.tMidSec)||(t0+(cue.tEnd-t0)/2),cam=String(b.cameraMove||'');
     if(i>0&&b.hinge)sfx.push({t:t0,name:b.hinge==='BUT'?'BOOP':'CLICK',why:'hinge '+b.hinge});
     if(/push-in|pull-back/.test(cam))sfx.push({t:t0+0.1,name:'WHOOSH',why:cam});
     if(/kick-shake/.test(cam)||cue.role==='climax')sfx.push({t:t0,name:'THUD',why:'climax hit'});
     if(/dutch-tilt/.test(cam))sfx.push({t:mid,name:'BOING',why:cam});
     if(cue.role==='callback')sfx.push({t:t0,name:'CHORD',why:'callback stab',voices:wadaVoices(pal,charId,b)});
  });
  (sb.sfxCues||[]).forEach(function(c){sfx.push({t:Number(c[0])||0,name:String(c[1]||'CLICK').toUpperCase(),gain:c[2],why:'storyboard cue'});});
   sfx.forEach(function(s){var q=quantize(s.t,base.bpm);s.tRaw=s.t;s.t=q.t;s.quantized=q.q;events.push({t:s.t,type:'sfx',name:s.name,gain:s.gain,voices:s.voices});});
   events.sort(function(a,b){return a.t-b.t||((b.type==='pad')-(a.type==='pad'));});
   var total=Number(sb.totalDurationSec)||(beats.length?Number(beats[beats.length-1].tEndSec)||0:0);
   return{seed:sd,archetype:arch,signature:base.signature,temperature:base.temperature,bpm:base.bpm,beatSec:r3(base.beatSec),key:base.key,mode:base.mode,
     loop:base.loop.map(function(c){return c.name;}),motif:{rel:base.motif.rel,durs:base.motif.durs,names:base.motif.rel.map(function(x){return mname(base.key.rootMidi+12+snapToScale(x,base.scale));})},
     cues:cues,events:events,sfx:sfx,callback:cb,totalSec:total,tailSec:TAIL,endSec:r3(total+TAIL),loop_:!!sb.loop};
}
 function guessArch(id){id=String(id);return/falcon|bird|owl|avian/i.test(id)?'avian':/sub|diver/i.test(id)?'submersible':/geo|poly/i.test(id)?'geometric':/horn|string|instr/i.test(id)?'instrument':/ink|brush|calli/i.test(id)?'calligraphic':/myth|dragon|serpent/i.test(id)?'mythic':/leaf|fern|bot|vine/i.test(id)?'botanical':'cetacean';}
 function wadaVoices(pal,charId,beat){
   try{var MA=root.MA;if(MA&&MA.computeWadaHarmonicChord){var spec=MA.getCharSpec?MA.getCharSpec(charId):null;var ch=MA.computeWadaHarmonicChord(pal,spec,(beat.characterPose||{}).rung||1,beat.tStartSec||0);return ch.voices.filter(function(v){return v.active&&v.gain>0;}).map(function(v){return{freqHz:v.freqHz,waveform:v.waveform,gain:v.gain};});}}catch(_e){}
   var rt=mtof(ROOTS[(Number(pal&&pal.id)||343)% 8]);return [1,1.25,1.5,2].map(function(r,i){return{freqHz:rt*r,waveform:i % 2?'triangle':'sine',gain:0.18/Math.sqrt(i+1)};});
}

 var S={ctx:null,plan:null,origin:0,cursor:0,ei:0,timer:null,playing:false,nodes:[],mix:null,bufs:{},noise:null,sr:44100,onend:null};
 var PM={sV:'setValueAtTime',eR:'exponentialRampToValueAtTime',lR:'linearRampToValueAtTime',cS:'cancelScheduledValues'};
 function param(p,fn){var k=PM[fn[0]];try{if(p&&typeof p[k]==='function')p[k].apply(p,fn.slice(1));}catch(_e){}}
 function gainNode(ctx,v){var g=ctx.createGain();param(g.gain,['sV',v,ctx.currentTime]);return g;}
 function buildMix(ctx){
   var master=gainNode(ctx,0.9),comp=ctx.createDynamicsCompressor?ctx.createDynamicsCompressor():null;
   if(comp){param(comp.threshold,['sV',-14,0]);param(comp.ratio,['sV',4,0]);param(comp.attack,['sV',0.004,0]);param(comp.release,['sV',0.25,0]);master.connect(comp);comp.connect(ctx.destination);}else master.connect(ctx.destination);
   var duck=gainNode(ctx,1),music=gainNode(ctx,1),sfxB=gainNode(ctx,0.85),pad=gainNode(ctx,0.5),pulse=gainNode(ctx,0.42),pluck=gainNode(ctx,0.6),bell=gainNode(ctx,0.45);
   var padLp=ctx.createBiquadFilter();padLp.type='lowpass';param(padLp.frequency,['sV',900,0]);param(padLp.Q,['sV',0.7,0]);
   pad.connect(padLp);padLp.connect(music);pulse.connect(music);pluck.connect(music);bell.connect(music);music.connect(duck);duck.connect(master);sfxB.connect(master);
   return{master:master,compressor:comp,duck:duck,music:music,sfx:sfxB,pad:pad,pulse:pulse,pluck:pluck,bell:bell,padFilter:padLp};
}
 function noiseBuf(ctx){if(S.noise)return S.noise;var n=Math.floor(S.sr),b=ctx.createBuffer(1,n,S.sr),d=b.getChannelData?b.getChannelData(0):new Float32Array(n),r=prng('noise');for(var i=0;i<n;i++)d[i]=r()*2-1;S.noise=b;return b;}
 function ksBuf(ctx,midi){
   var k='ks'+midi;if(S.bufs[k])return S.bufs[k];
   var sr=S.sr,f=mtof(midi),N=Math.max(2,Math.round(sr/f)),len=Math.floor(sr*1.4),b=ctx.createBuffer(1,len,sr),d=b.getChannelData?b.getChannelData(0):new Float32Array(len),r=prng('ks'+midi),ring=new Float32Array(N),decay=Math.pow(0.001,N/(sr*1.1)),lp=0;
   for(var i=0;i<N;i++){lp=0.5*lp+0.5*(r()*2-1);ring[i]=lp;}
   for(var n=0,p=0;n<len;n++){var a=ring[p],q=ring[(p+1)% N],y=0.5*(a+q)*decay;ring[p]=y;d[n]=a;p=(p+1)% N;}
   S.bufs[k]=b;return b;
}
 function env(g,when,peak,atk,dur){param(g.gain,['sV',0.0001,when]);param(g.gain,['eR',Math.max(0.0002,peak),when+atk]);param(g.gain,['eR',0.0001,when+dur]);}
 function src(ctx,buf,when,dur){var s=ctx.createBufferSource();s.buffer=buf;try{s.start(when);s.stop(when+dur+0.05);}catch(_e){}S.nodes.push(s);return s;}
 function osc(ctx,type,f,when,dur){var o=ctx.createOscillator();o.type=type;param(o.frequency,['sV',f,when]);try{o.start(when);o.stop(when+dur+0.05);}catch(_e){}S.nodes.push(o);return o;}
 var INST={
   pluck:function(ctx,m,e,when){var s=src(ctx,ksBuf(ctx,e.midi),when,1.4),g=ctx.createGain();param(g.gain,['sV',0.5*e.vel,when]);s.connect(g);g.connect(m.pluck);},
   bell:function(ctx,m,e,when){var f=mtof(e.midi),c=osc(ctx,'sine',f,when,e.dur),md=osc(ctx,'sine',f*3.5,when,e.dur),mg=ctx.createGain(),g=ctx.createGain();param(mg.gain,['sV',f*1.6,when]);param(mg.gain,['eR',f*0.05,when+e.dur*0.6]);md.connect(mg);mg.connect(c.frequency);env(g,when,0.4,0.004,e.dur);c.connect(g);g.connect(m.bell);},
   pad:function(ctx,m,e,when){e.midis.forEach(function(mi,i){var g=ctx.createGain();param(g.gain,['sV',0.0001,when]);param(g.gain,['lR',0.1,when+0.35]);param(g.gain,['sV',0.1,when+e.dur]);param(g.gain,['lR',0.0001,when+e.dur+0.5]);osc(ctx,'triangle',mtof(mi),when,e.dur+0.5).connect(g);osc(ctx,'sine',mtof(mi)*(1+0.0007*(i+1)),when,e.dur+0.5).connect(g);g.connect(m.pad);});},
   kick:function(ctx,m,e,when){var o=osc(ctx,'sine',150,when,0.25),g=ctx.createGain();param(o.frequency,['eR',42,when+0.1]);env(g,when,0.55*e.vel,0.003,0.22);o.connect(g);g.connect(m.pulse);},
   hat:function(ctx,m,e,when){var s=src(ctx,noiseBuf(ctx),when,0.06),hp=ctx.createBiquadFilter(),g=ctx.createGain();hp.type='highpass';param(hp.frequency,['sV',7000,when]);env(g,when,0.18*e.vel,0.002,0.05);s.connect(hp);hp.connect(g);g.connect(m.pulse);},
   sfx:function(ctx,m,e,when){var fn=SFX[e.name]||SFX.CLICK;var g=ctx.createGain();param(g.gain,['sV',e.gain!=null?clamp(e.gain*1.4,0.05,1.2):1,when]);g.connect(m.sfx);fn(ctx,g,when,e);duckAt(when,SFX_LEN[e.name]||0.15);}
};
 var SFX={
   WHOOSH:function(ctx,out,w){var s=src(ctx,noiseBuf(ctx),w,0.35),bp=ctx.createBiquadFilter(),g=ctx.createGain();bp.type='bandpass';param(bp.Q,['sV',1.2,w]);param(bp.frequency,['sV',300,w]);param(bp.frequency,['eR',2800,w+0.3]);env(g,w,0.45,0.1,0.32);s.connect(bp);bp.connect(g);g.connect(out);},
   THUD:function(ctx,out,w){var o=osc(ctx,'sine',100,w,0.3),g=ctx.createGain();param(o.frequency,['eR',34,w+0.15]);env(g,w,0.9,0.004,0.28);o.connect(g);g.connect(out);var s=src(ctx,noiseBuf(ctx),w,0.04),lp=ctx.createBiquadFilter(),g2=ctx.createGain();lp.type='lowpass';param(lp.frequency,['sV',400,w]);env(g2,w,0.4,0.002,0.03);s.connect(lp);lp.connect(g2);g2.connect(out);},
   CLICK:function(ctx,out,w){var s=src(ctx,noiseBuf(ctx),w,0.015),hp=ctx.createBiquadFilter(),g=ctx.createGain();hp.type='highpass';param(hp.frequency,['sV',3000,w]);env(g,w,0.5,0.001,0.012);s.connect(hp);hp.connect(g);g.connect(out);},
   BOOP:function(ctx,out,w){var o=osc(ctx,'triangle',740,w,0.15),g=ctx.createGain();param(o.frequency,['eR',590,w+0.08]);env(g,w,0.4,0.004,0.14);o.connect(g);g.connect(out);},
   BOING:function(ctx,out,w){var o=osc(ctx,'triangle',320,w,0.5),l=osc(ctx,'sine',14,w,0.5),lg=ctx.createGain(),g=ctx.createGain();param(o.frequency,['eR',90,w+0.45]);param(lg.gain,['sV',40,w]);l.connect(lg);lg.connect(o.frequency);env(g,w,0.4,0.01,0.5);o.connect(g);g.connect(out);},
   CHORD:function(ctx,out,w,e){(e.voices||[]).forEach(function(v,i){var o=osc(ctx,v.waveform||'sine',v.freqHz,w+i*0.05,1.35),g=ctx.createGain();env(g,w+i*0.05,v.gain,0.08,1.35-i*0.05);o.connect(g);g.connect(out);});}
};
 function duckAt(when,hold){
   if(!S.mix)return;var g=S.mix.duck.gain,lo=Math.pow(10,DUCK_DB/20);
   param(g,['cS',when]);param(g,['sV',1,when]);param(g,['lR',lo,when+DUCK_ATK]);param(g,['sV',lo,when+DUCK_ATK+hold]);param(g,['lR',1,when+DUCK_ATK+hold+DUCK_REL]);
}
 function tlNow(){return S.ctx?S.ctx.currentTime-S.origin:0;}
 function fire(e,when){try{INST[e.type](S.ctx,S.mix,e,when);}catch(_err){}}
 function pump(){
   if(!S.playing||!S.ctx||!S.plan)return;
   var ev=S.plan.events,horizon=tlNow()+LOOK;
   while(S.ei<ev.length&&ev[S.ei].t<horizon){var e=ev[S.ei++];fire(e,Math.max(S.ctx.currentTime,S.origin+e.t));}
   S.cursor=horizon;
   if(S.ei>=ev.length&&tlNow()>S.plan.endSec){if(S.plan.loop_){seek(0);}else{S.playing=false;if(S.onend)S.onend();return;}}
   if(typeof setTimeout==='function')S.timer=setTimeout(pump,90);
}
 function stopNodes(){S.nodes.forEach(function(n){try{n.stop(0);}catch(_e){}try{n.disconnect();}catch(_e){}});S.nodes=[];if(S.mix)param(S.mix.duck.gain,['cS',0]);}
 function resumeCtx(){if(S.ctx&&S.ctx.state==='suspended'&&S.ctx.resume){try{S.ctx.resume();}catch(_e){}}}
 function installGesture(){if(S._g||typeof root.addEventListener!=='function')return;S._g=true;['pointerdown','keydown','touchstart'].forEach(function(ev){root.addEventListener(ev,resumeCtx,{passive:true});});}
 function schedule(ctx,planObj,t0,opts){
   dispose(false);S.ctx=ctx;S.sr=ctx.sampleRate||44100;S.plan=planObj;S.mix=buildMix(ctx);S.onend=opts&&opts.onend||null;installGesture();resumeCtx();
   seek(t0||0);return{plan:planObj,mix:S.mix,seek:seek,play:play,pause:pause,position:tlNow};
}
 function seek(t){
   if(!S.ctx||!S.plan)return;t=clamp(Number(t)||0,0,S.plan.endSec);if(S.timer)clearTimeout(S.timer);stopNodes();
   S.origin=S.ctx.currentTime+0.02-t;S.cursor=t;var ev=S.plan.events,i=0;while(i<ev.length&&ev[i].t<t)i++;S.ei=i;
   var lastPad=null;for(var k=i-1;k>=0;k--)if(ev[k].type==='pad'){lastPad=ev[k];break;}
   if(lastPad&&lastPad.t+lastPad.dur>t)fire({type:'pad',midis:lastPad.midis,dur:lastPad.t+lastPad.dur-t},S.ctx.currentTime+0.02);
   S.playing=true;pump();
}
 function play(){if(!S.ctx)return;resumeCtx();if(!S.playing)seek(S.cursorPaused!=null?S.cursorPaused:S.cursor);}
 function pause(){if(!S.ctx)return;S.cursorPaused=tlNow();S.playing=false;if(S.timer)clearTimeout(S.timer);stopNodes();}
 function sync(t,playing){if(!S.ctx)return;if(!playing){if(S.playing)pause();return;}if(!S.playing){seek(t);return;}if(Math.abs(tlNow()-t)>0.12)seek(t);}
 function duck(ms){if(S.ctx)duckAt(S.ctx.currentTime,Math.max(0,(Number(ms)||150)/1000));}
 function sfx(name,at,gain){if(!S.ctx||!S.mix)return null;var nm=String(name||'CLICK').toUpperCase(),t=at==null?tlNow():Number(at),q=S.plan?quantize(t,S.plan.bpm):{t:t,q:false};var when=Math.max(S.ctx.currentTime,S.origin+q.t);var e={type:'sfx',name:nm,gain:gain};if(nm==='CHORD'&&S.plan){var c=S.plan.sfx.filter(function(s){return s.voices;})[0];e.voices=c?c.voices:wadaVoices(null,'ceti-whale',{});}fire(e,when);return{name:nm,t:q.t,quantized:q.q};}
 function dispose(full){if(S.timer)clearTimeout(S.timer);S.timer=null;stopNodes();S.playing=false;if(S.mix){try{S.mix.master.disconnect();}catch(_e){}}S.mix=null;S.plan=full===false?S.plan:null;if(full!==false){S.ctx=null;S.bufs={};S.noise=null;}}

 var API={plan:plan,scoreForBeat:scoreForBeat,schedule:schedule,seek:seek,play:play,pause:pause,sync:sync,duck:duck,sfx:sfx,dispose:dispose,
   get mix(){return S.mix;},get state(){return{playing:S.playing,t:tlNow(),ei:S.ei};},SIG:SIG,LOOPS:LOOPS,TEMPO:TEMPO,temperatureOf:temperatureOf,_quantize:quantize,version:'B.1'};
 root.MUSIC_B=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:this));
