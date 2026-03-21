import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./landing.css";

type Color = [number,number,number];
const PEOPLE_DATA = [
  {salary:"$3,200", handle:"0xa8d840…4f", role:"Engineer"},
  {salary:"$8,500", handle:"0x3f6b12…aa", role:"Designer"},
  {salary:"$12,000",handle:"0xe2d740…c1", role:"Lead Dev"},
  {salary:"$5,750", handle:"0x9c3a17…88", role:"Ops"},
];
const MQ_ITEMS = ["Encrypted Salaries","Inco Lightning","euint256 Handles","Attested Decrypt","TEE Verified","Base Sepolia","Zero Plaintext","PayrollVault"];
const MQ_ALL  = [...MQ_ITEMS,...MQ_ITEMS];
const C = (s:string) => <code>{s}</code>;

/* ═══════════════════════════════════════════════════════════
   CANVAS ANIMATION
═══════════════════════════════════════════════════════════ */
function usePayrollAnimation(ref:React.RefObject<HTMLCanvasElement>){
  useEffect(()=>{
    const cv=ref.current; if(!cv) return;
    const cx=cv.getContext("2d")!;
    const B:Color=[47,107,255], G:Color=[26,255,140], W:Color=[210,222,255], A:Color=[255,180,50];
    const HX="0123456789abcdef";
    const rgba=(c:Color,a:number)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const rh=()=>HX[Math.floor(Math.random()*16)];
    const rhex=(n:number)=>{let s="0x";for(let i=0;i<n;i++)s+=rh();return s;};
    const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
    const lerp3=(a:Color,b:Color,t:number):Color=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
    const clamp=(v:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,v));
    let W2:number,H:number,raf:number,eX:number,eY:number,pX:number,pY:number,pR:number;
    const ep:{x:number;y:number}[]=[];
    const layout=()=>{eX=W2*.14;eY=H*.5;pX=W2*.5;pY=H*.5;pR=Math.min(W2,H)*.115;ep.length=0;for(let i=0;i<4;i++)ep.push({x:W2*.84,y:H*(.18+i*(.66/3))});};
    const resize=()=>{const p=cv.parentElement!;const w=p.clientWidth;const h=clamp(w*1.05,460,600);cv.width=W2=w;cv.height=H=h;layout();};
    const drawPerson=(x:number,y:number,r:number,col:Color,alpha:number,boss:boolean,glow:number)=>{
      if(alpha<=0.02)return; cx.save(); cx.globalAlpha=alpha;
      const hR=r*.42,hy=y-r*.55,bW=r*.72,bH=r*.55,bY=y+r*.14,bR=r*.28,sY=bY-r*.05;
      if(glow>0){const au=cx.createRadialGradient(x,hy,0,x,hy,r*2.4);au.addColorStop(0,rgba(col,glow*.22));au.addColorStop(1,rgba(col,0));cx.beginPath();cx.arc(x,hy,r*2.4,0,Math.PI*2);cx.fillStyle=au;cx.fill();}
      cx.shadowColor=rgba(col,.5);cx.shadowBlur=r*.9;cx.shadowOffsetY=r*.15;
      cx.beginPath();cx.arc(x,hy,hR,0,Math.PI*2);cx.fillStyle=rgba(col,.9);cx.fill();
      cx.shadowBlur=0;cx.shadowOffsetY=0;
      cx.beginPath();cx.arc(x,hy,hR*.3,0,Math.PI*2);cx.fillStyle="rgba(3,5,9,.55)";cx.fill();
      cx.beginPath();cx.moveTo(x-hR*.275,hy+hR*.85);cx.lineTo(x-hR*.275,sY);cx.lineTo(x+hR*.275,sY);cx.lineTo(x+hR*.275,hy+hR*.85);cx.fillStyle=rgba(col,.6);cx.fill();
      cx.beginPath();cx.moveTo(x-bW/2,sY+r*.06);cx.quadraticCurveTo(x-bW/2,sY,x-bW*.3,sY);cx.lineTo(x+bW*.3,sY);cx.quadraticCurveTo(x+bW/2,sY,x+bW/2,sY+r*.06);cx.lineTo(x+bW/2,bY+bH);cx.quadraticCurveTo(x+bW/2,bY+bH+bR,x+bW/2-bR,bY+bH+bR);cx.lineTo(x-bW/2+bR,bY+bH+bR);cx.quadraticCurveTo(x-bW/2,bY+bH+bR,x-bW/2,bY+bH);cx.closePath();
      const bg=cx.createLinearGradient(x,sY,x,bY+bH+bR);bg.addColorStop(0,rgba(col,.75));bg.addColorStop(1,rgba(col,.45));cx.shadowColor=rgba(col,.4);cx.shadowBlur=r*.8;cx.fillStyle=bg;cx.fill();cx.shadowBlur=0;
      if(boss){cx.restore();cx.save();cx.globalAlpha=alpha*.9;const bx=x-r*.38,by2=bY+bH-r*.05,bw=r*.76,bh=r*.44;cx.fillStyle="rgba(3,5,9,.7)";cx.strokeStyle=rgba(col,.4);cx.lineWidth=0.8;cx.beginPath();cx.roundRect(bx,by2,bw,bh,3);cx.fill();cx.stroke();cx.font=`bold ${r*.28}px 'Space Mono',monospace`;cx.textAlign="center";cx.textBaseline="middle";cx.fillStyle=rgba(col,.85);cx.fillText("$",x,by2+bh*.5);}
      cx.restore();
    };
    let pAng=0,pAct=0,pHeat=0;
    const drawPortal=()=>{
      const x=pX,y=pY,r=pR; pAng+=.012;
      const bl=cx.createRadialGradient(x,y,0,x,y,r*1.6);bl.addColorStop(0,rgba(B,.08+pAct*.09));bl.addColorStop(1,rgba(B,0));cx.beginPath();cx.arc(x,y,r*1.6,0,Math.PI*2);cx.fillStyle=bl;cx.fill();
      for(let i=0;i<3;i++){cx.beginPath();cx.arc(x,y,r*(1.35+i*.22),0,Math.PI*2);cx.strokeStyle=rgba(B,(.06-i*.015)*(.5+pAct*.5));cx.lineWidth=1;cx.stroke();}
      [[r*1.18,[14,8],1,1.2,.35],[r,[8,12],-1.5,1,.28],[r*.82,[5,10],2.2,.8,.2]].forEach(([rr,da,sp,lw,al])=>{cx.save();cx.translate(x,y);cx.rotate(pAng*(sp as number));cx.beginPath();cx.arc(0,0,rr as number,0,Math.PI*2);cx.strokeStyle=rgba(B,(al as number)*(.6+pAct*.4));cx.lineWidth=lw as number;cx.setLineDash(da as number[]);cx.stroke();cx.setLineDash([]);cx.restore();});
      for(let i=0;i<8;i++){const an=pAng+(i/8)*Math.PI*2,pu=.5+.5*Math.sin(pAng*3+i*.8);cx.beginPath();cx.arc(x+Math.cos(an)*r*1.18,y+Math.sin(an)*r*1.18,2.2,0,Math.PI*2);cx.fillStyle=rgba(B,.5+pu*.4*pAct);cx.fill();}
      cx.beginPath();cx.arc(x,y,r*.85,0,Math.PI*2);const fa=cx.createRadialGradient(x,y,0,x,y,r*.85);fa.addColorStop(0,`rgba(47,107,255,${.13+pAct*.1+pHeat*.12})`);fa.addColorStop(1,"rgba(47,107,255,.04)");cx.fillStyle=fa;cx.fill();
      cx.beginPath();cx.arc(x,y,r*.85,0,Math.PI*2);cx.strokeStyle=rgba(B,.35+pAct*.3+pHeat*.2);cx.lineWidth=1.4;cx.stroke();
      cx.save();cx.beginPath();cx.arc(x,y,r*.84,0,Math.PI*2);cx.clip();cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+Math.cos(pAng*2.5)*r,y+Math.sin(pAng*2.5)*r);cx.strokeStyle=rgba(B,.15*(.5+pAct*.5));cx.lineWidth=r*.6;cx.stroke();cx.restore();
      cx.save();cx.textAlign="center";cx.textBaseline="middle";cx.font=`800 ${r*.42}px 'Syne',sans-serif`;cx.shadowColor=rgba(B,.8);cx.shadowBlur=12;cx.fillStyle=rgba(B,.75+pAct*.2);cx.fillText("TEE",x,y-r*.1);cx.shadowBlur=0;cx.font=`${r*.22}px 'Space Mono',monospace`;cx.fillStyle=rgba(W,.22);cx.fillText("INCO LIGHTNING",x,y+r*.28);cx.restore();
      if(pHeat>0){cx.beginPath();cx.arc(x,y,r*.85,0,Math.PI*2);cx.strokeStyle=rgba(G,pHeat*.6);cx.lineWidth=2;cx.stroke();pHeat=Math.max(0,pHeat-.04);}
    };
    const drawBadge=(x:number,y:number,txt:string,mode:string,alpha:number)=>{
      if(alpha<=0.02)return; cx.save(); cx.globalAlpha=alpha;
      const fs=Math.max(9,W2*.022); cx.font=`700 ${fs}px 'Space Mono',monospace`;
      const tw=cx.measureText(txt).width,ph=fs*.7,pv=fs*.5,bw=tw+ph*2,bh=fs+pv*2;
      let col:Color,bg:string,bd:string;
      if(mode==="plain"){col=G;bg="rgba(26,255,140,.07)";bd="rgba(26,255,140,.22)";}
      else if(mode==="handle"){col=B;bg="rgba(47,107,255,.07)";bd="rgba(47,107,255,.22)";}
      else if(mode==="scramble"){col=A;bg="rgba(255,180,50,.06)";bd="rgba(255,180,50,.22)";}
      else{col=G;bg="rgba(26,255,140,.14)";bd="rgba(26,255,140,.5)";}
      cx.fillStyle=bg;cx.strokeStyle=bd;cx.lineWidth=.9;cx.beginPath();cx.roundRect(x-bw/2,y-bh/2,bw,bh,4);cx.fill();cx.stroke();
      if(mode==="reveal"){cx.shadowColor=rgba(G,.7);cx.shadowBlur=14;}
      cx.fillStyle=rgba(col,.95);cx.textAlign="center";cx.textBaseline="middle";cx.fillText(txt,x,y);cx.shadowBlur=0;cx.restore();
    };
    const cp=(x0:number,y0:number,x1:number,y1:number,s:number)=>({cpx:(x0+x1)*.5+(y1-y0)*.12*s,cpy:(y0+y1)*.5});
    const bez=(x0:number,y0:number,x1:number,y1:number,cpx:number,cpy:number,t:number)=>{const m=1-t;return{x:m*m*x0+2*m*t*cpx+t*t*x1,y:m*m*y0+2*m*t*cpy+t*t*y1};};
    const drawCurve=(x0:number,y0:number,x1:number,y1:number,cpx:number,cpy:number,prog:number,ba:number)=>{
      cx.save();cx.lineCap="round";cx.setLineDash([3,10]);cx.strokeStyle=rgba(B,ba*.22);cx.lineWidth=.8;cx.beginPath();
      for(let s=0;s<=60;s++){const t=s/60,m=1-t,px=m*m*x0+2*m*t*cpx+t*t*x1,py=m*m*y0+2*m*t*cpy+t*t*y1;s===0?cx.moveTo(px,py):cx.lineTo(px,py);}cx.stroke();cx.setLineDash([]);
      if(prog>.01){cx.lineWidth=1.2;cx.beginPath();for(let s=0;s<=60*prog;s++){const t=s/60,m=1-t,px=m*m*x0+2*m*t*cpx+t*t*x1,py=m*m*y0+2*m*t*cpy+t*t*y1;s===0?cx.moveTo(px,py):cx.lineTo(px,py);}const g=cx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,rgba(G,.6));g.addColorStop(.5,rgba(B,.55));g.addColorStop(1,rgba(B,.4));cx.strokeStyle=g;cx.stroke();}cx.restore();
    };
    const drawParticle=(x0:number,y0:number,x1:number,y1:number,cpx:number,cpy:number,t:number,pr:number)=>{
      const pt=bez(x0,y0,x1,y1,cpx,cpy,t);
      const col:Color=t<.42?G:t<.58?lerp3(G,B,(t-.42)/.16):B;
      cx.save();for(let i=12;i>=1;i--){const tp=bez(x0,y0,x1,y1,cpx,cpy,Math.max(0,t-i*.014));cx.beginPath();cx.arc(tp.x,tp.y,pr*.8*(1-i/12),0,Math.PI*2);cx.fillStyle=rgba(col,(1-i/12)*.35*(t>.05?1:t/.05));cx.fill();}
      const gw=cx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,pr*3.5);gw.addColorStop(0,rgba(col,.55));gw.addColorStop(1,rgba(col,0));cx.beginPath();cx.arc(pt.x,pt.y,pr*3.5,0,Math.PI*2);cx.fillStyle=gw;cx.fill();
      cx.beginPath();cx.arc(pt.x,pt.y,pr,0,Math.PI*2);cx.fillStyle=rgba(col,1);cx.fill();cx.restore();
    };
    const drawBurst=(x:number,y:number,t:number,col:Color,r:number)=>{
      cx.save();for(let i=0;i<10;i++){const an=(i/10)*Math.PI*2;cx.beginPath();cx.arc(x+Math.cos(an)*r*t*3.2,y+Math.sin(an)*r*t*3.2,r*(1-t)*.5,0,Math.PI*2);cx.fillStyle=rgba(col,(1-t)*.8);cx.fill();}
      cx.beginPath();cx.arc(x,y,r*t*2.5,0,Math.PI*2);cx.strokeStyle=rgba(col,(1-t)*.4);cx.lineWidth=1;cx.stroke();cx.restore();
    };
    interface P{salary:string;handle:string;role:string;alpha:number;bm:string;bt:string;ba:number;pulse:number;pt:any;lp2:number;burst:number;rv:number;st:string;stk:number;}
    const ppl:P[]=PEOPLE_DATA.map(d=>({...d,alpha:0,bm:"plain",bt:d.salary,ba:0,pulse:0,pt:null,lp2:0,burst:-1,rv:-1,st:"idle",stk:0}));
    const ST={I:"intro",ID:"idle",S:"sending",C:"claiming",R:"reset"};
    let state=ST.I,tick=0,stk=0,ctk=0,ePulse=0,iAlpha=0;
    const launch=(i:number)=>{const e=ep[i];const c=cp(eX,eY,e.x,e.y,i%2===0?1:-1);ppl[i].pt={t:0,spd:.006+Math.random()*.003,cpx:c.cpx,cpy:c.cpy};ppl[i].lp2=0;ppl[i].st="fly";};
    const update=()=>{
      tick++;
      if(state===ST.I){iAlpha=Math.min(1,tick/55);ppl.forEach((p,i)=>{p.alpha=clamp((tick-i*12-8)/45,0,1);if(p.alpha>.1)p.ba=Math.min(1,p.ba+.04);});if(tick>80){state=ST.ID;tick=0;}}
      if(state===ST.ID){ePulse=.5+.5*Math.sin(tick*.12);pAct=lerp(pAct,.3,.04);if(tick>55){state=ST.S;tick=0;stk=0;launch(0);}}
      if(state===ST.S){stk++;ePulse=Math.max(0,ePulse-.012);pAct=lerp(pAct,.85,.06);if(stk===45)launch(1);if(stk===88)launch(2);if(stk===130)launch(3);ppl.forEach(p=>{if(p.st==="fly"&&p.pt){p.pt.t=Math.min(1,p.pt.t+p.pt.spd);p.lp2=p.pt.t;if(p.pt.t>.40&&p.pt.t<.44)pHeat=1;if(p.pt.t>=1){p.pt=null;p.st="scr";p.burst=0;p.stk=0;}}if(p.st==="scr"){p.stk++;p.bm="scramble";if(p.stk%2===0)p.bt=rhex(6);if(p.burst>=0)p.burst=Math.min(1,p.burst+.055);if(p.stk>40){p.st="hdl";p.bm="handle";p.bt=p.handle;p.pulse=1;}}});if(ppl.every(p=>p.st==="hdl"||p.st==="done")){state=ST.C;tick=0;ctk=0;}}
      if(state===ST.C){pAct=lerp(pAct,.5,.03);ctk++;const idx=ppl.findIndex(p=>p.st==="hdl");if(idx!==-1&&ctk>30){ppl[idx].st="clm";ppl[idx].rv=0;ctk=0;}ppl.forEach(p=>{if(p.st!=="clm")return;p.rv++;if(p.rv<20){p.bm="scramble";p.bt=rhex(6);}else if(p.rv<60){p.bm="reveal";p.bt=p.salary;p.pulse=1;}else if(p.rv<80){p.bm="scramble";p.bt=rhex(6);}else{p.bm="handle";p.bt=p.handle;p.st="done";p.pulse=0;}});ppl.forEach(p=>{p.pulse=Math.max(0,p.pulse-.018);});if(ppl.every(p=>p.st==="done")&&ctk>90){state=ST.R;tick=0;}}
      if(state===ST.R){ppl.forEach(p=>{p.alpha=lerp(p.alpha,0,.05);p.ba=lerp(p.ba,0,.05);});iAlpha=lerp(iAlpha,0,.05);pAct=lerp(pAct,0,.05);ePulse=0;if(tick>65){ppl.forEach((p,i)=>Object.assign(p,{alpha:0,bm:"plain",bt:PEOPLE_DATA[i].salary,ba:0,pulse:0,pt:null,lp2:0,burst:-1,rv:-1,st:"idle",stk:0}));state=ST.I;tick=0;iAlpha=0;pAct=0;ePulse=0;}}
    };
    const render=()=>{
      cx.clearRect(0,0,W2,H);const am=cx.createRadialGradient(eX,eY,0,eX,eY,W2*.7);am.addColorStop(0,"rgba(47,107,255,.05)");am.addColorStop(1,"rgba(0,0,0,0)");cx.fillStyle=am;cx.fillRect(0,0,W2,H);
      ppl.forEach((p,i)=>{if(p.alpha<.05)return;const e=ep[i];const c=cp(eX,eY,e.x,e.y,i%2===0?1:-1);drawCurve(eX,eY,e.x,e.y,c.cpx,c.cpy,p.lp2,p.alpha);});
      drawPortal();
      if(iAlpha>.02){const r=Math.min(W2,H)*.065;drawPerson(eX,eY,r,B,iAlpha,true,ePulse*.75);cx.save();cx.globalAlpha=iAlpha*.4;cx.font=`${r*.5}px 'Space Mono',monospace`;cx.textAlign="center";cx.textBaseline="top";cx.fillStyle=rgba(W,1);cx.fillText("EMPLOYER",eX,eY+r*2.3);cx.restore();}
      if((state===ST.S||state===ST.ID)&&iAlpha>.5){const pu=.5+.5*Math.sin(tick*.15);cx.save();cx.globalAlpha=iAlpha*pu;cx.font=`700 ${W2*.022}px 'Space Mono',monospace`;cx.textAlign="center";cx.textBaseline="bottom";cx.fillStyle=rgba(B,.8);cx.fillText(state===ST.ID?"READY TO SEND":"SENDING PAYROLL…",eX,eY-Math.min(W2,H)*.14);cx.restore();}
      ppl.forEach((p,i)=>{if(p.alpha<.02)return;const e=ep[i];const r=Math.min(W2,H)*.055;const col=p.st==="idle"||p.st==="fly"?W:B;drawPerson(e.x,e.y,r,col,p.alpha,false,p.pulse*.85);cx.save();cx.globalAlpha=p.alpha*.38;cx.font=`${r*.5}px 'Space Mono',monospace`;cx.textAlign="center";cx.textBaseline="top";cx.fillStyle=rgba(W,1);cx.fillText(p.role.toUpperCase(),e.x,e.y+r*2.1);cx.restore();drawBadge(e.x,e.y-r*2.2,p.bt,p.bm,p.alpha*p.ba);if(p.burst>=0&&p.burst<1)drawBurst(e.x,e.y,p.burst,B,r*.4);if(p.st==="fly"&&p.pt){const c=cp(eX,eY,e.x,e.y,i%2===0?1:-1);drawParticle(eX,eY,e.x,e.y,c.cpx,c.cpy,p.pt.t,Math.min(W2,H)*.012);}if(p.st==="clm"&&p.rv>=20&&p.rv<35){drawBurst(e.x,e.y-r*2.2,(p.rv-20)/15,G,r*.35);}});
    };
    const loop=()=>{update();render();raf=requestAnimationFrame(loop);};
    const ro=new ResizeObserver(()=>{cancelAnimationFrame(raf);resize();layout();loop();});
    ro.observe(cv.parentElement!);resize();loop();
    return()=>{cancelAnimationFrame(raf);ro.disconnect();};
  },[ref]);
}

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════════ */
function useScrollReveal(rootRef:React.RefObject<HTMLElement>){
  useEffect(()=>{
    const root=rootRef.current; if(!root) return;

    /* group reveals — stagger siblings */
    const groupIo=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const sibs=[...e.target.parentElement!.querySelectorAll(".lp-rv,.lp-rv-l,.lp-rv-r")];
        setTimeout(()=>e.target.classList.add("in"),sibs.indexOf(e.target as Element)*90);
        groupIo.unobserve(e.target);
      });
    },{threshold:.1});
    root.querySelectorAll(".lp-rv,.lp-rv-l,.lp-rv-r").forEach(el=>groupIo.observe(el));

    /* faq items — stagger individually */
    const faqIo=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const sibs=[...e.target.parentElement!.querySelectorAll(".lp-faq-item")];
        setTimeout(()=>e.target.classList.add("in"),sibs.indexOf(e.target as Element)*80);
        faqIo.unobserve(e.target);
      });
    },{threshold:.08});
    root.querySelectorAll(".lp-faq-item").forEach(el=>faqIo.observe(el));

    /* role cards — trigger rstep stagger */
    const roleIo=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        e.target.classList.add("in");
        roleIo.unobserve(e.target);
      });
    },{threshold:.15});
    root.querySelectorAll(".lp-role").forEach(el=>roleIo.observe(el));

    return()=>{groupIo.disconnect();faqIo.disconnect();roleIo.disconnect();};
  },[rootRef]);
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function LandingPage(){
  const canvasRef=useRef<HTMLCanvasElement>(null!);
  const rootRef  =useRef<HTMLDivElement>(null!);
  usePayrollAnimation(canvasRef);
  useScrollReveal(rootRef);

  return(
  <div className="lp" ref={rootRef}>

    {/* NAV */}
    <header className="lp-nav">
     <a href="/" className="lp-logo">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
    <rect width="24" height="24" rx="6" fill="rgba(47,107,255,0.15)"/>
    <path d="M7 7.5h10L7 16.5h10" stroke="#2F6BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  Zalary
</a>
      <nav className="lp-nav-links">
        <a href="#how">How It Works</a><a href="#privacy">Privacy Model</a>
        <a href="#employer">Employers</a><a href="#employee">Employees</a><a href="#stack">Stack</a>
      </nav>
      <div className="lp-nav-r">
        <div className="lp-net"><div className="lp-ndot"/>Base Sepolia</div>
        <Link to="/employer" className="lp-nav-btn">Launch App</Link>
      </div>
    </header>

    {/* MARQUEE */}
    <div className="lp-mq">
      <div className="lp-mq-track">
        {MQ_ALL.map((t,i)=><div className="lp-mq-item" key={i}><span className="lp-mq-txt">{t}</span><span className="lp-mq-sep">◆</span></div>)}
      </div>
    </div>

    {/* HERO */}
    <section className="lp-hero">
      <div className="lp-hero-bg"/><div className="lp-hero-dots"/>
      <div className="lp-copy">
        <div className="lp-eyebrow"><span className="lp-ebl"/>Powered by Inco Lightning on Base Sepolia</div>
        <h1 className="lp-h1">
          <span className="lp-hl"><span className="lp-hli lp-cw" style={{"--d":".4s"}as React.CSSProperties}>PRIVATE</span></span>
          <span className="lp-hl"><span className="lp-hli lp-cb" style={{"--d":".55s"}as React.CSSProperties}>PAY</span></span>
          <span className="lp-hl"><span className="lp-hli lp-co" style={{"--d":".7s"}as React.CSSProperties}>ON-CHAIN</span></span>
        </h1>
        <p className="lp-sub">
          Every salary is encrypted into a <b>euint256 handle</b> by Inco Lightning's TEE network
          before any transaction reaches the chain. What gets broadcast is cryptographically sealed:
          unreadable to every party except the authorized recipient.
        </p>
        <div className="lp-ctas">
          <Link to="/employer" className="lp-btn-p">Launch App <span className="lp-ar">→</span></Link>
          <a href="#how" className="lp-btn-g">How It Works <span className="lp-ar">↓</span></a>
        </div>
        <div className="lp-stats">
          <div className="lp-sc"><div className="lp-sv">0<em>%</em></div><div className="lp-sl">Plaintext on-chain</div></div>
          <div className="lp-sc"><div className="lp-sv">euint<em>256</em></div><div className="lp-sl">Handle type</div></div>
          <div className="lp-sc"><div className="lp-sv">2<em>-step</em></div><div className="lp-sl">Claim flow</div></div>
          <div className="lp-sc"><div className="lp-sv">TEE<em>+</em>KMS</div><div className="lp-sl">Attestation</div></div>
        </div>
      </div>
      <div className="lp-scene">
        <canvas ref={canvasRef} className="lp-canvas"/>
        <div className="lp-legend">
          <div className="lp-li lp-li-g"><span className="lp-lpip"/>Plaintext Salary</div>
          <span className="lp-lar">→</span>
          <div className="lp-li lp-li-b"><span className="lp-lpip"/>TEE Portal</div>
          <span className="lp-lar">→</span>
          <div className="lp-li lp-li-d"><span className="lp-lpip"/>euint256 Handle</div>
        </div>
      </div>
    </section>

    {/* POWERED-BY */}
    <div className="lp-ps lp-rv">
      <div className="lp-ps-lbl">Deployed on</div>
      <div className="lp-ps-logos">
        <div className="lp-ps-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          Base Sepolia
        </div>
        <div className="lp-ps-div"/>
        <div className="lp-ps-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Inco Lightning
        </div>
        <div className="lp-ps-div"/>
        <div className="lp-ps-logo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 8h5M8 16h3"/></svg>
          <span className="lp-ps-addr">PayrollVault · 0x6ACbEE7Dd0817e286eF858EB8f4bDAc0C0A242dD</span>
          <a href="https://sepolia.basescan.org/address/0x6ACbEE7Dd0817e286eF858EB8f4bDAc0C0A242dD" target="_blank" rel="noreferrer" className="lp-ps-scan">↗</a>
        </div>
      </div>
    </div>

    {/* ROLES */}
    <section className="lp-sec" id="employer">
      <div className="lp-sec-head lp-rv">
        <div>
          <div className="lp-sec-tag">Platform Roles</div>
          <h2 className="lp-sec-h">Who It's<br/><span className="lp-cb">Built For</span></h2>
        </div>
        <p className="lp-sec-desc">
          Zalary separates payroll administration from salary receipt into two distinct protocol flows,
          each with dedicated wallet interactions, on-chain state transitions, and cryptographic
          guarantees enforced at every step.
        </p>
      </div>
      <div className="lp-roles lp-rv">
        <div className="lp-role">
          <div className="lp-role-wm">ER</div>
          <div className="lp-role-pill"><span className="lp-role-pill-dot"/>For Employers</div>
          <div className="lp-role-title">Run Payroll.<br/>Stay Private.</div>
          <p className="lp-role-desc">
            Configure a payroll run, submit encrypted salary allocations for your team, fund the escrow
            via PayrollVault, and open the claim window. Not a single plaintext figure touches the chain.
          </p>
          <div className="lp-role-steps">
            <div className="lp-rstep"><span className="lp-rn">01</span><span className="lp-rt"><b>Create template:</b> define settlement token, deadline, and employee roster via {C("createPayroll")}</span></div>
            <div className="lp-rstep"><span className="lp-rn">02</span><span className="lp-rt"><b>Encrypt allocations:</b> salary amounts are converted to ciphertexts by the Inco SDK before upload</span></div>
            <div className="lp-rstep"><span className="lp-rn">03</span><span className="lp-rt"><b>Upload to vault:</b> {C("uploadAllocations")} stores only {C("euint256")} handles on-chain, never raw figures</span></div>
            <div className="lp-rstep"><span className="lp-rn">04</span><span className="lp-rt"><b>Fund and activate:</b> {C("fundPayroll")} locks cUSDC in escrow; {C("activatePayroll")} opens the claim window</span></div>
          </div>
        </div>
        <div className="lp-role" id="employee">
          <div className="lp-role-wm">EE</div>
          <div className="lp-role-pill"><span className="lp-role-pill-dot"/>For Employees</div>
          <div className="lp-role-title">Claim Your<br/>Salary.</div>
          <p className="lp-role-desc">
            Your salary lives on-chain as an encrypted handle tied exclusively to your wallet address.
            Claiming it requires a TEE-signed attestation. No third party can read, infer, or intercept
            your compensation at any point.
          </p>
          <div className="lp-role-steps">
            <div className="lp-rstep"><span className="lp-rn">01</span><span className="lp-rt"><b>View claimables:</b> see active payroll runs your wallet address is authorized to claim</span></div>
            <div className="lp-rstep"><span className="lp-rn">02</span><span className="lp-rt"><b>Request claim:</b> {C("requestClaim")} triggers an encrypted comparison on-chain</span></div>
            <div className="lp-rstep"><span className="lp-rn">03</span><span className="lp-rt"><b>Attested decrypt:</b> Inco Lightning KMS issues a cryptographic proof bound to your allocation handle</span></div>
            <div className="lp-rstep"><span className="lp-rn">04</span><span className="lp-rt"><b>Finalize:</b> {C("finalizeClaim")} verifies KMS signatures on-chain and releases cUSDC to your wallet</span></div>
          </div>
        </div>
      </div>
    </section>

    {/* PRIVACY */}
    <section className="lp-sec" id="privacy">
      <div className="lp-sec-head lp-rv">
        <div>
          <div className="lp-sec-tag">Privacy Model</div>
          <h2 className="lp-sec-h">Encrypted<br/>by <span className="lp-cb">design</span></h2>
        </div>
        <p className="lp-sec-desc">
          Every sensitive value is shielded behind Inco Lightning's <code>euint256</code> handles:
          opaque <code>bytes32</code> identifiers with no readable value on-chain.
          The boundary between what is private and what is public is precise, deliberate, and enforced
          at the protocol level.
        </p>
      </div>
      <div className="lp-psplit lp-rv">
        <div className="lp-pcol">
          <div className="lp-pcol-hdr enc">
            <div className="lp-pcol-ico enc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div className="lp-pcol-t enc">Encrypted by Inco TEE</div>
              <div className="lp-pcol-s">Unreadable on-chain without attestation</div>
            </div>
          </div>
          <div className="lp-pcards">
            {[
              {name:"Salary Amounts",hdl:"0xa8d840…4f",desc:<>Each allocation is stored as a {C("euint256")} handle. Decryption requires a valid TEE signature bound to the employee's specific wallet address.</>},
              {name:"cUSDC Balances",hdl:"0x3f6b12…aa",desc:<>{C("balanceOf(address)")} returns a {C("bytes32")} handle, never a number. Resolving the actual balance requires calling {C("attestedDecrypt")} with proper authorization.</>},
              {name:"Withdrawal Intents",hdl:"0xe2d740…c1",desc:<>Withdrawal amounts travel as ciphertexts. The {C("pendingAmountHandle")} stored on-chain reveals nothing about the intent, timing, or size of a withdrawal.</>},
            ].map((item,i)=>(
              <div className="lp-pcard enc" key={i}>
                <div className="lp-pcard-name">{item.name}</div>
                <div className="lp-pcard-val"><span className="lp-pcard-hdl">{item.hdl}</span></div>
                <p className="lp-pcard-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lp-pcol">
          <div className="lp-pcol-hdr pub">
            <div className="lp-pcol-ico pub">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>
            </div>
            <div>
              <div className="lp-pcol-t pub">Visible on-chain</div>
              <div className="lp-pcol-s">Inherent to public ERC20 standards</div>
            </div>
          </div>
          <div className="lp-pcards">
            {[
              {name:"USDC Deposits",val:"transferFrom →",desc:"Vault funding uses a standard ERC20 transfer. Deposit amounts and addresses are publicly visible, an unavoidable property of the underlying token standard."},
              {name:"Final USDC Payouts",val:"transfer →",desc:"Settlement disburses standard USDC to employees. The final payout amount appears on-chain only at this step; every prior stage of the transaction was fully confidential."},
              {name:"Payroll Metadata",val:"uint32 count",desc:"Participant count, funding deadline, and employer address are stored as plaintext. Only per-employee salary figures are protected behind encrypted handles."},
            ].map((item,i)=>(
              <div className="lp-pcard pub" key={i}>
                <div className="lp-pcard-name">{item.name}</div>
                <div className="lp-pcard-val"><span className="lp-pub-val">{item.val}</span></div>
                <p className="lp-pcard-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* HOW IT WORKS */}
    <div className="lp-how-band lp-rv" id="how">
      <div>
        <div className="lp-sec-tag" style={{marginBottom:".875rem"}}>How It Works</div>
        <h2 className="lp-how-title">Four steps.<br/><span className="lp-cb">Zero</span> exposure.</h2>
      </div>
      <p className="lp-how-desc">
        The entire lifecycle is coordinated server-side before any transaction reaches Base Sepolia.
        Ciphertext is generated by the Inco encryptor, committed to the contract, and stored as an
        opaque handle. The chain records a transaction. It never sees a salary.
      </p>
    </div>
    <section className="lp-sec" style={{paddingTop:"0",borderTop:"none"}}>
      <div className="lp-steps lp-rv">
        {[
          {n:"01",t:"Create Payroll",
           d:<>The employer calls {C("createPayroll")} specifying the settlement token, funding deadline, and team headcount. The backend registers the run and assigns it {C("scheduled")} status.</>,
           i:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></>},
          {n:"02",t:"Encrypt and Upload",
           d:<>The Inco encryptor generates a ciphertext for each salary amount. {C("uploadAllocations")} submits these to PayrollVault as {C("euint256")} handles. No plaintext figure is ever broadcast.</>,
           i:<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></>},
          {n:"03",t:"Fund and Activate",
           d:<>{C("fundPayroll")} transfers cUSDC into the vault escrow. Once confirmed, {C("activatePayroll")} opens the claim window and advances the run to {C("active")} status.</>,
           i:<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>},
          {n:"04",t:"Claim and Finalize",
           d:<>The employee calls {C("requestClaim")}. The frontend retrieves pending handles, runs {C("attestedDecrypt")} to obtain KMS signatures, then submits them to {C("finalizeClaim")}. cUSDC is released.</>,
           i:<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>},
        ].map((s,i)=>(
          <div className="lp-step" key={i}>
            <div className="lp-step-n">{s.n}</div>
            <div className="lp-step-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{s.i}</svg></div>
            <div className="lp-step-t">{s.t}</div>
            <p className="lp-step-d">{s.d}</p>
          </div>
        ))}
      </div>
    </section>

    {/* STACK */}
    <section className="lp-sec" id="stack">
      <div className="lp-stack">
        <div className="lp-rv-l">
          <div className="lp-sec-tag">Tech Stack</div>
          <h2 className="lp-sec-h">Every Layer<br/><span className="lp-cb">Built For</span><br/>Privacy</h2>
          <p className="lp-stack-desc">
            Six tightly integrated components spanning the contract layer, off-chain coordination,
            and client-side encryption. The entire pipeline is purpose-built so that <b>salary data
            never exists in plaintext at any stage.</b>
          </p>
          <div className="lp-tags">
            {["Inco Lightning TEE","euint256","Base Sepolia"].map(t=><span className="lp-tag hi" key={t}>{t}</span>)}
            {["Solidity 0.8.26","Django + DRF","Celery + Redis","Node.js + viem","wagmi + React","TypeScript"].map(t=><span className="lp-tag lo" key={t}>{t}</span>)}
          </div>
        </div>
        <div className="lp-scards lp-rv-r">
          {[
            {i:<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
             n:"PayrollVault.sol",
             d:"Manages the complete payroll lifecycle on Base Sepolia: encrypted allocation storage, cUSDC escrow, state machine progression, and two-step claim verification.",
             b:"Contract"},
            {i:<><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>,
             n:"ConfidentialToken (cUSDC)",
             d:"balanceOf returns a bytes32 handle, never a readable balance. All internal accounting runs through euint256, keeping token amounts fully opaque at the contract level.",
             b:"Token"},
            {i:<><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></>,
             n:"SwapRouter.sol",
             d:"Converts standard ERC20 USDC into confidential cUSDC. Accepts encrypted withdrawal ciphertexts and processes KMS-attested finalizations without ever exposing amounts.",
             b:"Router"},
            {i:<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
             n:"Django REST and Celery",
             d:"Coordinates the full execution pipeline: transaction submission, confirmation polling, state transitions, and retry logic. Celery beat handles automated scheduling across all active payroll runs.",
             b:"API"},
            {i:<><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
             n:"Inco Encryptor Server",
             d:"Lightweight Node.js service wrapping the @inco/js SDK. Accepts plaintext salary amounts and returns TEE-bound ciphertexts ready for direct on-chain submission.",
             b:"Worker"},
            {i:<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
             n:"Inco Lightning KMS",
             d:"Inco's decentralized co-validator network running inside Trusted Execution Environments. Issues cryptographic attestations via attestedDecrypt that authorize specific wallets to resolve their encrypted salary handles.",
             b:"External"},
          ].map((s,i)=>(
            <div className="lp-scard" key={i}>
              <div className="lp-scard-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{s.i}</svg></div>
              <div style={{flex:1}}><div className="lp-scard-name">{s.n}</div><div className="lp-scard-desc">{s.d}</div></div>
              <div className="lp-scard-badge">{s.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="lp-sec" id="faq">
      <div className="lp-sec-head lp-rv">
        <div>
          <div className="lp-sec-tag">Common Questions</div>
          <h2 className="lp-sec-h">Built different.<br/><span className="lp-cb">Here's why.</span></h2>
        </div>
        <p className="lp-sec-desc">
          Zalary is powered by TEE-based confidential compute via Inco Lightning: not zero-knowledge proofs,
          not trusted administrators, not off-chain encryption. Here is what that means in practice.
        </p>
      </div>
      <div className="lp-faq lp-rv">
        {[
          {q:"Why TEE over zero-knowledge proofs?",
           a:<>ZK proofs require compiling a separate circuit for each type of operation, introducing significant overhead: often seconds to minutes per salary entry at scale. Inco Lightning's TEE co-validators process {C("euint256")} operations in milliseconds with no circuit setup required, making confidential payroll practical for real teams today.</>},
          {q:"Can the employer read employee salaries?",
           a:<>No. Once an allocation is encrypted and submitted via {C("uploadAllocations")}, even the employer wallet cannot read the handle value. Only the employee address granted decryption rights at encryption time can resolve the amount by calling {C("attestedDecrypt")}.</>},
          {q:"What if an employee loses wallet access?",
           a:"Claims are bound to the employee wallet registered at allocation time. Unclaimed funds remain locked in PayrollVault escrow until the funding deadline expires, at which point the employer may reclaim them through the contract's built-in expiry mechanism."},
          {q:"Is Zalary production-ready?",
           a:"Zalary is currently live on Base Sepolia as part of Inco Lightning's beta program. All smart contracts are auditable at the deployed address. Mainnet deployment will follow Inco Lightning's general availability launch."},
          {q:"What token is used for payroll?",
           a:"Employers fund payroll using standard USDC, which is converted to Confidential USDC (cUSDC) through the SwapRouter at a 1:1 rate. Employees receive cUSDC handles they can redeem for USDC at any time. There is no protocol fee on testnet."},
          {q:"How does this differ from off-chain encryption?",
           a:"Off-chain encryption depends on a trusted server holding private keys, which creates a single point of failure. Zalary's encryption is verified by Inco's decentralized TEE co-validator network. No single party holds keys, and the proof of correct decryption is recorded on-chain."},
        ].map((item,i)=>(
          <div className="lp-faq-item" key={i}>
            <div className="lp-faq-q">{item.q}</div>
            <p className="lp-faq-a">{item.a}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="lp-cta" id="cta">
      <div className="lp-cta-bloom-c"/><div className="lp-cta-bloom-o"/>
      <div className="lp-cta-wm">INCO</div>
      <div className="lp-cta-pts">
        {[[12,20,9,0,.35,.08],[88,15,11,.8,.4,.1],[6,65,8,1.2,.3,.06],[93,70,10,.3,.35,.08],[22,78,12,2,.25,.05],[75,82,7,1.5,.3,.07],[50,8,13,.5,.2,.04],[35,90,9,2.5,.28,.06],[65,12,10,1.8,.22,.05]].map(([l,t,pd,ps,po,po2],i)=>(
          <div key={i} className="lp-cta-p" style={{left:`${l}%`,top:`${t}%`,["--pd" as string]:`${pd}s`,["--ps" as string]:`${ps}s`,["--po" as string]:po,["--po2" as string]:po2}}/>
        ))}
      </div>
      <div className="lp-cta-eye">Deploy Confidential Payroll Today</div>
      <h2 className="lp-cta-h">
        <span className="lp-cta-line lp-cta-white"      style={{"--ld":".3s"}as React.CSSProperties}>PAY YOUR</span>
        <span className="lp-cta-line lp-cta-ghost-line" style={{"--ld":".5s"}as React.CSSProperties}>TEAM</span>
        <span className="lp-cta-line lp-cta-blue-line"  style={{"--ld":".7s"}as React.CSSProperties}>PRIVATELY</span>
      </h2>
      <p className="lp-cta-sub">
        Confidential payroll infrastructure built on Base Sepolia. Every salary encrypted before
        broadcast, every claim verified by TEE attestation. No plaintext. No compromise.
      </p>
      <div className="lp-cta-btns">
        <Link to="/employer" className="lp-cta-main">Launch App <span className="lp-ar">→</span></Link>
        <a href="#how" className="lp-cta-ghost-btn">How It Works <span className="lp-ar">↓</span></a>
      </div>
    </section>

    {/* FOOTER */}
    <footer className="lp-footer">
      <div className="lp-ft-top">
        <div className="lp-ft-brand">
          <div className="lp-ft-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight:"6px",flexShrink:0}}>
              <rect width="24" height="24" rx="6" fill="rgba(47,107,255,0.15)"/>
              <path d="M7 7.5h10L7 16.5h10" stroke="#2F6BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>Zalary
          </div>
          <p className="lp-ft-tagline">Confidential payroll infrastructure for EVM-compatible blockchains. Zero plaintext. Every salary sealed by Inco Lightning TEE.</p>
          <div className="lp-ft-socials">
            {[{l:"GitHub",p:"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"},{l:"Twitter",p:"M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"}].map(s=>(
              <a href="#" key={s.l} className="lp-ft-social" aria-label={s.l}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.p}/></svg></a>
            ))}
          </div>
        </div>
        <div className="lp-ft-col">
          <div className="lp-ft-col-t">Product</div>
          <a href="#employer">For Employers</a><a href="#employee">For Employees</a>
          <a href="#how">How It Works</a><a href="#faq">FAQ</a>
          <Link to="/employer">Launch App</Link>
        </div>
        <div className="lp-ft-col">
          <div className="lp-ft-col-t">Technical</div>
          <a href="#">Documentation</a><a href="#">Smart Contracts</a>
          <a href="#stack">Tech Stack</a><a href="#privacy">Privacy Model</a><a href="#">API Reference</a>
        </div>
        <div className="lp-ft-col">
          <div className="lp-ft-col-t">Ecosystem</div>
          <a href="#">Inco Network</a><a href="#">Base Sepolia</a>
          <a href="https://sepolia.basescan.org/address/0x6ACbEE7Dd0817e286eF858EB8f4bDAc0C0A242dD" target="_blank" rel="noreferrer">BaseScan ↗</a>
          <a href="#">GitHub ↗</a><a href="#">Discord ↗</a>
        </div>
      </div>
      <div className="lp-ft-bot">
        <div className="lp-ft-contract">
          <span className="lp-ft-clbl">PayrollVault</span>
          <span className="lp-ft-caddr">0x6ACbEE7Dd0817e286eF858EB8f4bDAc0C0A242dD</span>
          <a href="https://sepolia.basescan.org/address/0x6ACbEE7Dd0817e286eF858EB8f4bDAc0C0A242dD" target="_blank" rel="noreferrer" className="lp-ft-clink">View on BaseScan ↗</a>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:".875rem",flexWrap:"wrap"}}>
          <span className="lp-ft-chain">Base Sepolia · 84532</span>
          <span className="lp-ft-copy">© 2026 Zalary. Built with Inco Lightning.</span>
        </div>
      </div>
    </footer>

  </div>
  );
}