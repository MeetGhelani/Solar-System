"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, Stars, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════
// PROCEDURAL TEXTURE ENGINE
// ═══════════════════════════════════════════════════════════════
function createTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  size = 1024
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size, size);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
function noise2D(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function fbm(x: number, y: number, o = 5) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) { v += a * noise2D(x * f, y * f); a *= 0.5; f *= 2.1; }
  return v;
}

function createCloudTexture() {
  return createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 320; i++) {
      const cx = Math.random() * w, cy = Math.random() * h, r = 18 + Math.random() * 65;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(255,255,255,${0.45 + Math.random() * 0.5})`);
      g.addColorStop(0.4, `rgba(255,255,255,${0.1 + Math.random() * 0.2})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  }, 1024);
}

const textures: Record<string, () => THREE.CanvasTexture> = {
  Mercury: () => createTexture((ctx, w, h) => {
    const bg = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    bg.addColorStop(0,"#c0afa0"); bg.addColorStop(1,"#6a5a50");
    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    for(let i=0;i<240;i++){
      const cx=Math.random()*w,cy=Math.random()*h,r=2+Math.random()*30;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,"rgba(40,30,25,0.75)"); g.addColorStop(0.6,"rgba(70,60,50,0.3)"); g.addColorStop(1,"rgba(180,160,140,0.05)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    }
    for(let y=0;y<h;y+=4) for(let x=0;x<w;x+=4){
      const v=fbm(x/w*6,y/h*6)*40-20;
      ctx.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)/65})`; ctx.fillRect(x,y,4,4);
    }
  }),
  Venus: () => createTexture((ctx, w, h) => {
    ctx.fillStyle="#d4a855"; ctx.fillRect(0,0,w,h);
    for(let y=0;y<h;y++){
      const t=y/h, sw=Math.sin(t*18+fbm(0,t*4)*3)*0.5+0.5;
      ctx.fillStyle=`rgb(${Math.floor(195+sw*60)},${Math.floor(145+sw*65)},${Math.floor(55+sw*45)})`; ctx.fillRect(0,y,w,1);
    }
    for(let i=0;i<100;i++){
      const x=Math.random()*w;
      ctx.strokeStyle=`rgba(255,220,140,${0.04+Math.random()*0.06})`; ctx.lineWidth=1+Math.random()*3;
      ctx.beginPath(); ctx.moveTo(x,Math.random()*h); ctx.lineTo(x+(Math.random()-0.5)*30,Math.random()*h); ctx.stroke();
    }
  }),
  Earth: () => createTexture((ctx, w, h) => {
    ctx.fillStyle="#1a6fa8"; ctx.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=2) for(let x=0;x<w;x+=2){
      const v=fbm(x/w*4-2,y/h*4-2,6);
      if(v>0.52){ const gr=v>0.58; ctx.fillStyle=gr?`rgb(${55+Math.random()*35},${115+Math.random()*55},${35+Math.random()*25})`:`rgb(${175+Math.random()*45},${145+Math.random()*35},${85+Math.random()*35})`; ctx.fillRect(x,y,2,2); }
    }
    for(let py=0;py<90;py++){ const a=Math.pow((90-py)/90,2)*0.9; ctx.fillStyle=`rgba(225,238,255,${a})`; ctx.fillRect(0,py,w,1); ctx.fillRect(0,h-1-py,w,1); }
    for(let i=0;i<130;i++){
      const cx=Math.random()*w,cy=Math.random()*h,len=25+Math.random()*90;
      ctx.strokeStyle=`rgba(255,255,255,${0.07+Math.random()*0.14})`; ctx.lineWidth=4+Math.random()*11; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+len*(Math.random()-0.5),cy+(Math.random()-0.5)*22); ctx.stroke();
    }
  }),
  Mars: () => createTexture((ctx, w, h) => {
    ctx.fillStyle="#a0360a"; ctx.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=3) for(let x=0;x<w;x+=3){
      const v=fbm(x/w*8,y/h*8,4);
      ctx.fillStyle=`rgb(${Math.floor(140+v*65)},${Math.floor(45+v*32)},18)`; ctx.fillRect(x,y,3,3);
    }
    for(let i=0;i<90;i++){
      const cx=Math.random()*w,cy=Math.random()*h,r=4+Math.random()*38;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,"rgba(35,8,3,0.65)"); g.addColorStop(0.7,"rgba(75,18,8,0.2)"); g.addColorStop(1,"rgba(195,95,45,0.04)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle="rgba(210,228,255,0.65)"; ctx.beginPath(); ctx.ellipse(w/2,28,w*0.27,38,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="rgba(55,8,3,0.5)"; ctx.lineWidth=9;
    ctx.beginPath(); ctx.moveTo(w*0.18,h*0.52); ctx.bezierCurveTo(w*0.38,h*0.5,w*0.62,h*0.54,w*0.82,h*0.51); ctx.stroke();
  }),
  Jupiter: () => createTexture((ctx, w, h) => {
    const bands=["#c9a872","#d4b882","#a07840","#e8d4a0","#b08850","#d8c490","#906830","#e0cc98","#a87840","#d0bc88"];
    const bH=h/bands.length;
    bands.forEach((col,i)=>{
      const wave=Math.sin(i*1.7)*12, gr=ctx.createLinearGradient(0,i*bH+wave,0,(i+1)*bH+wave);
      gr.addColorStop(0,col); gr.addColorStop(0.5,col+"dd"); gr.addColorStop(1,bands[(i+1)%bands.length]);
      ctx.fillStyle=gr; ctx.fillRect(0,i*bH+wave-10,w,bH+20);
    });
    for(let i=0;i<220;i++){
      ctx.strokeStyle=`rgba(${Math.random()>0.5?255:150},${Math.random()*110+95},48,0.07)`;
      ctx.lineWidth=1+Math.random()*4;
      ctx.beginPath(); ctx.moveTo(Math.random()*w,Math.random()*h); ctx.lineTo(Math.random()*w,Math.random()*h+(Math.random()-0.5)*8); ctx.stroke();
    }
    const gx=w*0.65,gy=h*0.62,gr=ctx.createRadialGradient(gx,gy,0,gx,gy,60);
    gr.addColorStop(0,"rgba(175,55,28,0.92)"); gr.addColorStop(0.5,"rgba(198,78,38,0.7)"); gr.addColorStop(1,"rgba(198,138,78,0)");
    ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(gx,gy,68,42,0.2,0,Math.PI*2); ctx.fill();
  }),
  Saturn: () => createTexture((ctx, w, h) => {
    const bands=["#e8d888","#d4c070","#f0e4a0","#c8b460","#dcc880","#b8a850","#e4d890"];
    const bh=h/bands.length;
    bands.forEach((col,i)=>{ const gr=ctx.createLinearGradient(0,i*bh,0,(i+1)*bh); gr.addColorStop(0,col); gr.addColorStop(1,bands[(i+1)%bands.length]); ctx.fillStyle=gr; ctx.fillRect(0,i*bh,w,bh+2); });
    for(let i=0;i<160;i++){ ctx.strokeStyle="rgba(255,240,160,0.05)"; ctx.lineWidth=2+Math.random()*7; ctx.beginPath(); ctx.moveTo(0,Math.random()*h); ctx.lineTo(w,Math.random()*h+(Math.random()-0.5)*22); ctx.stroke(); }
  }),
  Uranus: () => createTexture((ctx, w, h) => {
    const gr=ctx.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,"#a8f0f0"); gr.addColorStop(0.3,"#7adede"); gr.addColorStop(0.7,"#5ec8c8"); gr.addColorStop(1,"#3ab8b8");
    ctx.fillStyle=gr; ctx.fillRect(0,0,w,h);
    for(let i=0;i<22;i++){ ctx.strokeStyle="rgba(180,255,255,0.06)"; ctx.lineWidth=8+Math.random()*32; ctx.beginPath(); ctx.moveTo(0,Math.random()*h); ctx.lineTo(w,Math.random()*h); ctx.stroke(); }
    for(let y=0;y<h;y+=3) for(let x=0;x<w;x+=3){ const v=noise2D(x/w*10,y/h*10)*0.14; ctx.fillStyle=`rgba(100,240,240,${v})`; ctx.fillRect(x,y,3,3); }
  }),
  Neptune: () => createTexture((ctx, w, h) => {
    const gr=ctx.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,"#2030c8"); gr.addColorStop(0.4,"#1828b0"); gr.addColorStop(1,"#0c1870");
    ctx.fillStyle=gr; ctx.fillRect(0,0,w,h);
    for(let i=0;i<28;i++){ ctx.strokeStyle="rgba(80,120,255,0.08)"; ctx.lineWidth=4+Math.random()*22; ctx.beginPath(); ctx.moveTo(0,Math.random()*h); ctx.lineTo(w,Math.random()*h+(Math.random()-0.5)*16); ctx.stroke(); }
    const dx=w*0.4,dy=h*0.45,ds=ctx.createRadialGradient(dx,dy,0,dx,dy,52);
    ds.addColorStop(0,"rgba(5,10,80,0.88)"); ds.addColorStop(1,"rgba(20,40,200,0)");
    ctx.fillStyle=ds; ctx.beginPath(); ctx.ellipse(dx,dy,62,37,0.3,0,Math.PI*2); ctx.fill();
    for(let i=0;i<32;i++){ const cx=Math.random()*w,cy=Math.random()*h; ctx.fillStyle=`rgba(180,200,255,${0.28+Math.random()*0.42})`; ctx.beginPath(); ctx.ellipse(cx,cy,10+Math.random()*32,3+Math.random()*11,-0.2,0,Math.PI*2); ctx.fill(); }
  }),
  Moon: () => createTexture((ctx, w, h) => {
    ctx.fillStyle="#888"; ctx.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=3) for(let x=0;x<w;x+=3){ const c=Math.floor(110+fbm(x/w*8,y/h*8,5)*62); ctx.fillStyle=`rgb(${c},${c},${c})`; ctx.fillRect(x,y,3,3); }
    for(let i=0;i<65;i++){ const cx=Math.random()*w,cy=Math.random()*h,r=3+Math.random()*20; const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,"rgba(55,55,55,0.72)"); g.addColorStop(1,"rgba(150,150,150,0)"); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); }
  }),
  Io: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#e0b428"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 7, y / h * 7, 4);
      ctx.fillStyle = `rgb(${Math.floor(210 + v * 45)},${Math.floor(140 + v * 70)},${Math.floor(25 + v * 50)})`;
      ctx.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 45; i++) {
      const cx = Math.random() * w, cy = Math.random() * h, r = 4 + Math.random() * 22;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "#220804"); g.addColorStop(0.35, "#881a08"); g.addColorStop(0.7, "#d86010"); g.addColorStop(1, "rgba(224, 180, 40, 0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  }),
  Europa: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#e8eff4"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = noise2D(x / w * 12, y / h * 12) * 20;
      ctx.fillStyle = `rgb(${Math.floor(225 + v)},${Math.floor(235 + v * 0.8)},${Math.floor(245 + v * 0.5)})`; ctx.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 55; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(130 + Math.random() * 40)},${Math.floor(55 + Math.random() * 30)},${Math.floor(35 + Math.random() * 25)},${0.35 + Math.random() * 0.4})`;
      ctx.lineWidth = 1 + Math.random() * 3.5; ctx.beginPath();
      let sx = Math.random() * w, sy = Math.random() * h;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 4; j++) { sx += (Math.random() - 0.5) * 120; sy += (Math.random() - 0.5) * 80; ctx.lineTo(sx, sy); }
      ctx.stroke();
    }
  }),
  Ganymede: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#7a746e"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 6, y / h * 6, 5); const c = Math.floor(95 + v * 75);
      ctx.fillStyle = `rgb(${c},${c - 4},${c - 8})`; ctx.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 35; i++) {
      ctx.strokeStyle = "rgba(220,225,235,0.22)"; ctx.lineWidth = 3 + Math.random() * 8;
      ctx.beginPath(); ctx.moveTo(0, Math.random() * h); ctx.lineTo(w, Math.random() * h); ctx.stroke();
    }
  }),
  Callisto: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#4a4440"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 8, y / h * 8, 4); const c = Math.floor(65 + v * 40);
      ctx.fillStyle = `rgb(${c},${c},${c})`; ctx.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * w, cy = Math.random() * h, r = 2 + Math.random() * 14;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.4, "rgba(200,210,220,0.4)"); g.addColorStop(1, "rgba(70,65,60,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  }),
  Titan: () => createTexture((ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#d88020"); gr.addColorStop(0.5, "#e89830"); gr.addColorStop(1, "#c06815");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = noise2D(x / w * 5, y / h * 5) * 0.12;
      ctx.fillStyle = `rgba(255,210,130,${v})`; ctx.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 18; i++) {
      const cx = w * 0.2 + Math.random() * w * 0.6, cy = Math.random() * 100, r = 8 + Math.random() * 25;
      ctx.fillStyle = "rgba(40,25,15,0.45)"; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }),
  Enceladus: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#f4f8fc"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = "rgba(100,190,240,0.45)"; ctx.lineWidth = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.2 + Math.random() * w * 0.6, h * 0.75 + Math.random() * h * 0.2);
      ctx.lineTo(w * 0.2 + Math.random() * w * 0.6, h * 0.75 + Math.random() * h * 0.2);
      ctx.stroke();
    }
  }),
  Triton: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#b8d0d8"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 10, y / h * 10, 4);
      ctx.fillStyle = `rgb(${Math.floor(180 + v * 45)},${Math.floor(190 + v * 35)},${Math.floor(205 + v * 40)})`;
      ctx.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 35; i++) {
      const cx = Math.random() * w, cy = Math.random() * h;
      ctx.strokeStyle = "rgba(35,45,60,0.55)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (Math.random() - 0.5) * 40, cy - 25 - Math.random() * 30); ctx.stroke();
    }
  }),
  Phobos: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#55504c"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 8, y / h * 8, 4); const c = Math.floor(70 + v * 40);
      ctx.fillStyle = `rgb(${c},${c - 2},${c - 4})`; ctx.fillRect(x, y, 4, 4);
    }
    const g = ctx.createRadialGradient(w * 0.45, h * 0.5, 0, w * 0.45, h * 0.5, 75);
    g.addColorStop(0, "rgba(25,20,18,0.85)"); g.addColorStop(0.7, "rgba(45,40,35,0.4)"); g.addColorStop(1, "rgba(110,105,100,0.1)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w * 0.45, h * 0.5, 75, 0, Math.PI * 2); ctx.fill();
  }),
  Deimos: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#70645c"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 5, y / h * 5, 3); const c = Math.floor(100 + v * 35);
      ctx.fillStyle = `rgb(${c + 8},${c},${c - 8})`; ctx.fillRect(x, y, 4, 4);
    }
  }),
  Pluto: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#8a5840"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 6, y / h * 6, 4);
      ctx.fillStyle = `rgb(${Math.floor(130 + v * 50)},${Math.floor(80 + v * 40)},${Math.floor(55 + v * 30)})`;
      ctx.fillRect(x, y, 4, 4);
    }
    // Famous heart shape (Tombaugh Regio / Sputnik Planitia)
    ctx.save();
    ctx.translate(w * 0.48, h * 0.45);
    ctx.fillStyle = "rgba(240, 230, 220, 0.88)";
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.bezierCurveTo(-50, -40, -110, 40, 0, 110);
    ctx.bezierCurveTo(110, 40, 50, -40, 0, 20);
    ctx.fill();
    ctx.restore();
  }),
  Charon: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#686460"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 7, y / h * 7, 4);
      const c = Math.floor(90 + v * 40);
      ctx.fillStyle = `rgb(${c},${c},${c})`; ctx.fillRect(x, y, 4, 4);
    }
    // Mordor Macula - reddish dark north polar cap
    const g = ctx.createRadialGradient(w / 2, 25, 0, w / 2, 25, 60);
    g.addColorStop(0, "rgba(95, 35, 20, 0.85)");
    g.addColorStop(0.7, "rgba(80, 40, 30, 0.4)");
    g.addColorStop(1, "rgba(100, 100, 100, 0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(w / 2, 25, 120, 45, 0, 0, Math.PI * 2); ctx.fill();
  }),
  Ceres: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#504c48"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 8, y / h * 8, 4);
      const c = Math.floor(70 + v * 35);
      ctx.fillStyle = `rgb(${c},${c},${c})`; ctx.fillRect(x, y, 4, 4);
    }
    // Occator crater bright sodium carbonate salt spots (Cerealia Facula)
    for (const [ox, oy, sz] of [[0.45, 0.48, 12], [0.47, 0.46, 6], [0.43, 0.49, 4]]) {
      const g = ctx.createRadialGradient(w * ox, h * oy, 0, w * ox, h * oy, sz);
      g.addColorStop(0, "rgba(255, 255, 255, 1)");
      g.addColorStop(0.3, "rgba(220, 240, 255, 0.8)");
      g.addColorStop(1, "rgba(80, 80, 80, 0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w * ox, h * oy, sz, 0, Math.PI * 2); ctx.fill();
    }
  }),
  Halley: () => createTexture((ctx, w, h) => {
    ctx.fillStyle = "#22201e"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const v = fbm(x / w * 9, y / h * 9, 3);
      const c = Math.floor(30 + v * 30);
      ctx.fillStyle = `rgb(${c},${c},${c})`; ctx.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 15; i++) {
      const g = ctx.createRadialGradient(w * Math.random(), h * Math.random(), 0, w * Math.random(), h * Math.random(), 18);
      g.addColorStop(0, "rgba(180, 230, 255, 0.8)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w * Math.random(), h * Math.random(), 18, 0, Math.PI * 2); ctx.fill();
    }
  }),
};

// ═══════════════════════════════════════════════════════════════
// SHADER MATERIALS
// ═══════════════════════════════════════════════════════════════
const AtmosphereShaderMat = shaderMaterial(
  { glowColor: new THREE.Color(0.3, 0.6, 1.0), intensity: 0.8 },
  `varying vec3 vNormal; varying vec3 vViewDir;
   void main(){vNormal=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vViewDir=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  `uniform vec3 glowColor;uniform float intensity;varying vec3 vNormal;varying vec3 vViewDir;
   void main(){float rim=1.-max(0.,dot(normalize(vNormal),normalize(vViewDir)));float a=pow(rim,4.5)*intensity;gl_FragColor=vec4(glowColor*a,a);}`
);
extend({ AtmosphereShaderMat });

const SunMat = shaderMaterial(
  { time: 0 },
  `varying vec2 vUv;varying vec3 vNormal;
   void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  `uniform float time;varying vec2 vUv;varying vec3 vNormal;
   float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
   float ns(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
   float fb(vec2 p){float v=0.,a=0.5;for(int i=0;i<5;i++){v+=a*ns(p);p*=2.1;a*=0.5;}return v;}
   void main(){
     vec2 uv=vUv*4.;float n=fb(uv+time*.12),n2=fb(uv*1.8-time*.08+n),v=n*.6+n2*.4;
     vec3 col=mix(vec3(1.,.3,0.),vec3(1.,.95,.3),v);
     col=mix(col,vec3(1.,.6,0.),fb(uv*3.+time*.2)*.4);
     float e=1.-clamp(dot(vNormal,vec3(0,0,1)),0.,1.);
     col=mix(col,vec3(1.,.2,0.),pow(e,2.5)*.8);
     gl_FragColor=vec4(col,1.);
   }`
);
extend({ SunMat });

declare module "@react-three/fiber" {
  interface ThreeElements {
    atmosphereShaderMat: Omit<React.ComponentProps<"mesh">, "args"> & {
      glowColor?: THREE.ColorRepresentation; intensity?: number; [k: string]: unknown;
    };
    sunMat: { time?: number; [k: string]: unknown };
  }
}

// ═══════════════════════════════════════════════════════════════
// CELESTIAL SCIENTIFIC DATA (Sun, Planets & Major Moons)
// ═══════════════════════════════════════════════════════════════
export interface CelestialInfo {
  type: string;
  diameter: string;
  distanceSun?: string;
  distancePlanet?: string;
  parentPlanet?: string;
  orbitalPeriod: string;
  dayLength: string;
  temperature: string;
  moonCount?: number;
  gravity: string;
  atmosphere: string;
  description: string;
  funFact: string;
  accentColor: string;
  isSun?: boolean;
  isSpacecraft?: boolean;
  isComet?: boolean;
  mass?: string;
  coreTemp?: string;
  surfaceTemp?: string;
  age?: string;
}

const PLANET_INFO: Record<string, CelestialInfo> = {
  Sun: {
    type: "Yellow Dwarf Star · G2V",
    diameter: "1,392,700 km",
    mass: "1.989 × 10³⁰ kg (99.86% Solar System)",
    coreTemp: "15,000,000°C",
    surfaceTemp: "5,500°C",
    orbitalPeriod: "230 Million yrs (Galactic orbit)",
    dayLength: "27 Earth days (at equator)",
    temperature: "5,500°C (Surface)",
    gravity: "274 m/s² (28× Earth)",
    atmosphere: "H₂ 73.5%, He 24.9%, O₂ 0.77%",
    age: "4.6 Billion Years",
    description: "The supreme luminous center of our Solar System. The Sun generates immense energy through thermonuclear fusion in its core, converting 600 million tons of hydrogen into helium every second. Its gravitational grip anchors all planets, asteroids, and comets in eternal cosmic dance.",
    funFact: "About 1.3 million Earths could fit inside the Sun! Sunlight takes 8 minutes and 20 seconds to reach Earth.",
    accentColor: "#ffa500",
    isSun: true,
  },
  Mercury: {
    type:"Terrestrial",diameter:"4,879 km",distanceSun:"57.9M km",orbitalPeriod:"88 days",
    dayLength:"58.6 days",temperature:"-180 to 430°C",moonCount:0,gravity:"3.7 m/s²",
    atmosphere:"Negligible (Na, O₂ traces)",
    description:"The smallest and innermost planet. Its surface is heavily cratered from billions of years of impacts, resembling our Moon. Without an atmosphere, temperatures swing wildly between scorching days and freezing nights.",
    funFact:"A year on Mercury (88 Earth days) is shorter than a Mercurian day (176 Earth days) — you'd see only two sunrises per year.",
    accentColor:"#c8b8a8",
  },
  Venus: {
    type:"Terrestrial",diameter:"12,104 km",distanceSun:"108.2M km",orbitalPeriod:"225 days",
    dayLength:"243 days (retrograde)",temperature:"462°C (avg)",moonCount:0,gravity:"8.87 m/s²",
    atmosphere:"CO₂ 96.5%, N₂ 3.5%",
    description:"The hottest planet due to its runaway greenhouse effect. Thick clouds of sulfuric acid shroud the surface. Venus rotates backwards — the sun rises in the west. Atmospheric pressure is 92× Earth's.",
    funFact:"Venus spins so slowly that it's actually faster to travel around it than to wait for one full day to pass.",
    accentColor:"#e8c878",
  },
  Earth: {
    type:"Terrestrial",diameter:"12,756 km",distanceSun:"149.6M km",orbitalPeriod:"365.25 days",
    dayLength:"24 hours",temperature:"-88 to 58°C",moonCount:1,gravity:"9.81 m/s²",
    atmosphere:"N₂ 78%, O₂ 21%, Ar 0.9%",
    description:"Our home — the only known oasis of life in the universe. Liquid oceans cover 71% of the surface. A dynamic magnetosphere shields life from lethal solar radiation while the Moon stabilizes Earth's seasonal tilt.",
    funFact:"Earth is the densest planet in the Solar System, and the only one not named after a mythological god.",
    accentColor:"#4488ff",
  },
  Mars: {
    type:"Terrestrial",diameter:"6,792 km",distanceSun:"227.9M km",orbitalPeriod:"687 days",
    dayLength:"24h 37m",temperature:"-125 to 20°C",moonCount:2,gravity:"3.72 m/s²",
    atmosphere:"CO₂ 95%, N₂ 2.6%",
    description:"The Red Planet — rusted iron dust covers its vast desert surface. Home to Olympus Mons, the tallest volcano in the Solar System (21 km), and Valles Marineris, an immense grand canyon 4,000 km long.",
    funFact:"Mars has the tallest known mountain in the Solar System — Olympus Mons is nearly 3× the height of Mount Everest.",
    accentColor:"#e06030",
  },
  Jupiter: {
    type:"Gas Giant",diameter:"139,820 km",distanceSun:"778.5M km",orbitalPeriod:"11.9 years",
    dayLength:"9 hours 56 min",temperature:"-145°C (cloud top)",moonCount:95,gravity:"24.79 m/s²",
    atmosphere:"H₂ 89%, He 10%, CH₄, NH₃",
    description:"The undisputed titan of planets — twice as massive as all other planets combined. The Great Red Spot is a colossal anticyclone larger than Earth that has raged for centuries. Jupiter hosts a mini-solar system of 95 moons.",
    funFact:"Jupiter's Great Red Spot is a storm that has been raging for over 350 years — and generates winds up to 680 km/h.",
    accentColor:"#d4a060",
  },
  Saturn: {
    type:"Gas Giant",diameter:"116,460 km",distanceSun:"1.43B km",orbitalPeriod:"29.4 years",
    dayLength:"10 hours 42 min",temperature:"-178°C (avg)",moonCount:146,gravity:"10.44 m/s²",
    atmosphere:"H₂ 96.3%, He 3.2%",
    description:"The jewel of our Solar System, famed for its breathtaking ring system of billion ice particles and rock dust. Saturn is the least dense planet — so light that it would float in a giant cosmic bathtub of water.",
    funFact:"Saturn's rings span 282,000 km across, yet are extraordinarily razor-thin — typically just 10 to 100 meters thick!",
    accentColor:"#e0d080",
  },
  Uranus: {
    type:"Ice Giant",diameter:"50,724 km",distanceSun:"2.87B km",orbitalPeriod:"84 years",
    dayLength:"17 hours 14 min (retrograde)",temperature:"-224°C (avg)",moonCount:28,gravity:"8.87 m/s²",
    atmosphere:"H₂ 83%, He 15%, CH₄ 2%",
    description:"The sideways planet — Uranus is knocked on its side with a dramatic tilt of 98°. Atmospheric methane absorbs red wavelengths, giving the planet its cyan-aquamarine hue. It holds the record for the coldest recorded atmosphere.",
    funFact:"Because Uranus rolls on its side, each pole experiences 42 continuous Earth years of unbroken daylight followed by 42 years of night.",
    accentColor:"#70d8d8",
  },
  Neptune: {
    type:"Ice Giant",diameter:"49,244 km",distanceSun:"4.5B km",orbitalPeriod:"165 years",
    dayLength:"16 hours 6 min",temperature:"-201°C (avg)",moonCount:16,gravity:"11.15 m/s²",
    atmosphere:"H₂ 80%, He 19%, CH₄ 1%",
    description:"The windiest realm — supersonic winds tear through its cobalt-blue atmosphere at over 2,100 km/h. Neptune was mathematically predicted before it was ever observed by telescope, due to gravitational perturbations in Uranus's orbit.",
    funFact:"Neptune was discovered through mathematics — Urbain Le Verrier calculated its exact position from Uranus's orbital wobble.",
    accentColor:"#4466ee",
  },

  // ── DWARF PLANETS ──
  Pluto: {
    type: "Dwarf Planet (Kuiper Belt)",
    diameter: "2,376 km",
    distanceSun: "5.9B km (39.5 AU)",
    orbitalPeriod: "248 Earth years",
    dayLength: "6.4 Earth days",
    temperature: "-230°C",
    moonCount: 5,
    gravity: "0.62 m/s² (1/16 Earth)",
    atmosphere: "N₂, CH₄, CO (expands near perihelion)",
    description: "The frozen monarch of the Kuiper Belt. Demoted to dwarf planet status in 2006, Pluto astonished the world when NASA's New Horizons flew past in 2015, revealing towering water-ice mountains 3.5 km high and the vast, nitrogen-glacier heart of Sputnik Planitia. It orbits in a gravitational dance with its huge moon Charon.",
    funFact: "Pluto and Charon are a true double dwarf planet — they orbit a common barycenter located outside Pluto itself, keeping the same face locked toward each other forever.",
    accentColor: "#d29272",
  },
  Ceres: {
    type: "Dwarf Planet (Asteroid Belt)",
    diameter: "940 km",
    distanceSun: "414M km (2.77 AU)",
    orbitalPeriod: "4.6 Earth years",
    dayLength: "9 hours 4 min",
    temperature: "-105°C",
    moonCount: 0,
    gravity: "0.28 m/s²",
    atmosphere: "Transient water vapor exosphere",
    description: "The largest object in the asteroid belt between Mars and Jupiter, accounting for 1/3 of the belt's total mass. NASA's Dawn mission discovered that Ceres is an icy, hydrated world with bright sodium carbonate salt deposits in Occator Crater and the 4 km high ice-volcano Ahuna Mons.",
    funFact: "Ceres is believed to contain a remnant muddy subterranean ocean and may harbor more fresh water in its icy mantle than all of Earth's fresh water combined!",
    accentColor: "#b2aaa2",
  },

  // ── COMETS & SPACECRAFT ──
  Halley: {
    type: "Periodic Comet (1P/Halley)",
    diameter: "15 × 8 km (Nucleus)",
    distanceSun: "88M km (Perihelion) to 5.2B km (Aphelion)",
    orbitalPeriod: "75–76 Earth years",
    dayLength: "52 hours (tumbling)",
    temperature: "-200°C to 70°C (near Sun)",
    gravity: "0.001 m/s²",
    atmosphere: "Coma of H₂O, CO, organic dust",
    description: "The most famous comet in human history. Halley is the only known short-period comet regularly visible to the naked eye from Earth, recorded by observers worldwide since at least 240 BC. Near the Sun, solar radiation vaporizes volatile ices, blasting two luminous tails millions of kilometers into space.",
    funFact: "Halley's next perihelion return will occur in mid-2061! Its surface is as black as coal — reflecting only 4% of light, darker than blackboard paint.",
    accentColor: "#58c8ff",
    isComet: true,
  },
  "Voyager 1": {
    type: "Interstellar Robotic Probe",
    diameter: "3.7 m (Antenna dish)",
    distanceSun: "24.5 Billion km (164 AU)",
    orbitalPeriod: "Hyperbolic escape trajectory",
    dayLength: "N/A",
    temperature: "-270°C (Deep Space)",
    gravity: "N/A",
    atmosphere: "N/A",
    description: "The farthest human-made object in history. Launched by NASA on September 5, 1977, Voyager 1 completed historic flybys of Jupiter and Saturn before crossing the heliopause in August 2012 into pristine interstellar space. It carries the famous Golden Record containing sounds, music, and images of Earth.",
    funFact: "It takes radio signals traveling at the speed of light over 22 hours to travel one way between Voyager 1 and Earth!",
    accentColor: "#f0c040",
    isSpacecraft: true,
  },
  JWST: {
    type: "Space Telescope (NASA / ESA / CSA)",
    diameter: "6.5 m (Mirror) · 21 m (Sunshield)",
    distanceSun: "151.1M km (Sun-Earth L2 Point)",
    orbitalPeriod: "365.25 days (Halo orbit at L2)",
    dayLength: "N/A",
    temperature: "-233°C (Cryogenic cold side)",
    gravity: "N/A",
    atmosphere: "N/A",
    description: "The premier observatory of the modern era. Launched on Christmas Day 2021, the James Webb Space Telescope uses 18 gold-coated beryllium hexagonal mirrors and a 5-layer tennis-court-sized sunshield to peer through cosmic dust, capturing light from the universe's first galaxies formed over 13.5 billion years ago.",
    funFact: "Webb's mirror is coated with a microscopic layer of pure 24-karat gold that is just 100 nanometers thick — only 48 grams of gold in total!",
    accentColor: "#e6a817",
    isSpacecraft: true,
  },
  ISS: {
    type: "Low Earth Orbit Space Station",
    diameter: "109 m (Truss) · 73 m (Width)",
    distancePlanet: "408 km (above Earth)",
    parentPlanet: "Earth",
    orbitalPeriod: "92.6 minutes",
    dayLength: "16 sunrises & sunsets per 24h",
    temperature: "-157°C to 121°C",
    gravity: "Microgravity (~89% Earth gravity in freefall)",
    atmosphere: "Pressurized 1 atm (21% O₂, 78% N₂)",
    description: "Humanity's permanently occupied outpost in space. In continuous orbit since 1998 with international astronauts from 15 nations, the ISS travels at 28,000 km/h (8 km/s), conducting groundbreaking microgravity research in medicine, physics, and materials science.",
    funFact: "Astronauts aboard the ISS experience 16 sunrises and 16 sunsets every single Earth day!",
    accentColor: "#40e0d0",
    isSpacecraft: true,
  },

  // ── MOONS ──
  Moon: {
    type: "Terrestrial Moon",
    diameter: "3,474 km",
    parentPlanet: "Earth",
    distancePlanet: "384,400 km",
    orbitalPeriod: "27.3 Earth days",
    dayLength: "27.3 days (tidally locked)",
    temperature: "-130 to 120°C",
    gravity: "1.62 m/s² (1/6 Earth)",
    atmosphere: "Exosphere (trace He, Ar, Ne)",
    description: "Earth's natural companion. The fifth-largest moon in the Solar System, it stabilizes Earth's wobble, creating stable seasons and driving oceanic tides that helped life emerge on our world.",
    funFact: "Because there is no wind or liquid water on the Moon, Apollo astronaut bootprints will last for millions of years.",
    accentColor: "#c2c8d0",
  },
  Phobos: {
    type: "Captured Asteroid Moon",
    diameter: "22.2 km (irregular)",
    parentPlanet: "Mars",
    distancePlanet: "9,376 km",
    orbitalPeriod: "7 hours 39 min",
    dayLength: "7h 39m (tidally locked)",
    temperature: "-40 to -112°C",
    gravity: "0.0057 m/s²",
    atmosphere: "None",
    description: "The doomed inner moon of Mars. Dominated by the colossal Stickney crater, Phobos orbits Mars faster than Mars itself rotates, rising in the west and setting in the east twice every Martian day.",
    funFact: "Tidal forces are dragging Phobos toward Mars. In ~50 million years, it will break apart into a glittering ring around Mars.",
    accentColor: "#9c8b7e",
  },
  Deimos: {
    type: "Captured Asteroid Moon",
    diameter: "12.4 km (irregular)",
    parentPlanet: "Mars",
    distancePlanet: "23,463 km",
    orbitalPeriod: "30.3 hours",
    dayLength: "30.3 hours",
    temperature: "-40°C",
    gravity: "0.003 m/s²",
    atmosphere: "None",
    description: "The outer, smaller moon of Mars. Blanket by a thick layer of fine powdery regolith that softens its craters, giving it a surprisingly smooth appearance compared to rugged Phobos.",
    funFact: "Deimos's gravity is so weak that an astronaut running at 20 km/h could launch themselves straight off into space!",
    accentColor: "#b09b88",
  },
  Io: {
    type: "Galilean Volcanic Moon",
    diameter: "3,643 km",
    parentPlanet: "Jupiter",
    distancePlanet: "421,700 km",
    orbitalPeriod: "1.77 Earth days",
    dayLength: "1.77 days (tidally locked)",
    temperature: "-130°C (volcanoes up to 1,600°C)",
    gravity: "1.796 m/s²",
    atmosphere: "Thin SO₂ (Sulfur Dioxide)",
    description: "The most volcanically violent body in the Solar System. Intense gravitational tidal tug-of-war between Jupiter, Europa, and Ganymede continuously flexes Io's rocky mantle, driving over 400 active sulfur volcanoes.",
    funFact: "Io's volcanic plumes shoot sulfur plumes 500 km high into space, feeding a massive doughnut of plasma around Jupiter.",
    accentColor: "#e8c830",
  },
  Europa: {
    type: "Galilean Ocean Moon",
    diameter: "3,122 km",
    parentPlanet: "Jupiter",
    distancePlanet: "670,900 km",
    orbitalPeriod: "3.55 Earth days",
    dayLength: "3.55 days (tidally locked)",
    temperature: "-160 to -220°C",
    gravity: "1.315 m/s²",
    atmosphere: "Trace Oxygen (O₂)",
    description: "An icy jewel concealing a colossal warm saltwater ocean beneath a 20 km thick ice shell. Kept liquid by tidal heating, Europa holds twice as much water as all Earth's oceans combined, making it humanity's top target for finding alien life.",
    funFact: "Europa's smooth icy shell has almost no craters, proving it is constantly resurfaced and cracked by tidal ocean currents.",
    accentColor: "#70d0e8",
  },
  Ganymede: {
    type: "Galilean Icy Moon",
    diameter: "5,268 km",
    parentPlanet: "Jupiter",
    distancePlanet: "1,070,400 km",
    orbitalPeriod: "7.15 Earth days",
    dayLength: "7.15 days (tidally locked)",
    temperature: "-163°C (avg)",
    gravity: "1.428 m/s²",
    atmosphere: "Trace Oxygen (O₂)",
    description: "The king of all moons — Ganymede is larger than both Mercury and Pluto! It is the only moon in the Solar System known to generate its own internal magnetic field (magnetosphere), producing auroras at its poles.",
    funFact: "Ganymede contains a subsurface ocean with more liquid water than all Earth's oceans combined, sandwiched between dense ice layers.",
    accentColor: "#a89888",
  },
  Callisto: {
    type: "Galilean Cratered Moon",
    diameter: "4,821 km",
    parentPlanet: "Jupiter",
    distancePlanet: "1,882,700 km",
    orbitalPeriod: "16.7 Earth days",
    dayLength: "16.7 days (tidally locked)",
    temperature: "-139°C (avg)",
    gravity: "1.236 m/s²",
    atmosphere: "Very thin CO₂ and Oxygen",
    description: "The most heavily cratered object in the Solar System. Its surface is an ancient, frozen record of impacts spanning 4 billion years. Because it orbits outside Jupiter's radiation belts, it is considered the safest staging ground for human Jupiter missions.",
    funFact: "The giant multi-ring impact crater Valhalla on Callisto spans a staggering 3,800 kilometers across!",
    accentColor: "#888078",
  },
  Titan: {
    type: "Atmospheric Ice Moon",
    diameter: "5,149 km",
    parentPlanet: "Saturn",
    distancePlanet: "1,221,870 km",
    orbitalPeriod: "15.9 Earth days",
    dayLength: "15.9 days (tidally locked)",
    temperature: "-179°C",
    gravity: "1.352 m/s²",
    atmosphere: "N₂ 95%, CH₄ 5% (1.5× Earth surface pressure)",
    description: "The only moon with a dense atmosphere and liquid rivers, lakes, and seas on its surface (composed of liquid methane and ethane). A full hydrological cycle of methane clouds and rain carves golden dunes and canyons.",
    funFact: "Because Titan's atmosphere is dense and its gravity is low, a human could strap wings to their arms and flap their way into flight!",
    accentColor: "#e89830",
  },
  Enceladus: {
    type: "Cryovolcanic Ocean Moon",
    diameter: "504 km",
    parentPlanet: "Saturn",
    distancePlanet: "238,000 km",
    orbitalPeriod: "32.9 hours",
    dayLength: "32.9 hours (tidally locked)",
    temperature: "-198°C",
    gravity: "0.113 m/s²",
    atmosphere: "Water vapor geyser plumes",
    description: "The brightest body in the Solar System. Covered in pristine fresh ice that reflects nearly 100% of sunlight, Enceladus blasts gigantic geysers of liquid saltwater and organic molecules through 'tiger stripe' cracks into Saturn's rings.",
    funFact: "NASA's Cassini probe flew directly through Enceladus's geyser plumes and discovered warm hydrothermal vents on its ocean floor!",
    accentColor: "#78c8f0",
  },
  Triton: {
    type: "Captured Kuiper Belt Moon",
    diameter: "2,707 km",
    parentPlanet: "Neptune",
    distancePlanet: "354,760 km",
    orbitalPeriod: "5.88 Earth days (retrograde)",
    dayLength: "5.88 days (tidally locked)",
    temperature: "-235°C (coldest in solar system)",
    gravity: "0.779 m/s²",
    atmosphere: "Thin Nitrogen & Methane",
    description: "Neptune's extraordinary captive. Triton orbits in retrograde — opposite to Neptune's rotation — revealing it was captured from the icy Kuiper Belt. Active nitrogen cryovolcanoes erupt dark plumes into its cantaloupe-crusted sky.",
    funFact: "Triton is slowly falling toward Neptune. In ~3.6 billion years, it will cross the Roche limit and shatter into a ring system larger than Saturn's.",
    accentColor: "#5888e8",
  },
  Charon: {
    type: "Double Dwarf Planet Moon",
    diameter: "1,212 km",
    parentPlanet: "Pluto",
    distancePlanet: "19,640 km",
    orbitalPeriod: "6.39 days",
    dayLength: "6.39 days (mutually locked)",
    temperature: "-220°C",
    gravity: "0.288 m/s²",
    atmosphere: "None",
    description: "Pluto's gigantic companion. More than half the diameter and 12% the mass of Pluto, Charon is so massive relative to Pluto that the pair orbit a point in open space between them. It features an immense chasm four times deeper than the Grand Canyon and the mysterious dark reddish north pole named Mordor Macula.",
    funFact: "Charon never rises or sets in Pluto's sky — if you stood on the near side of Pluto, Charon would hang motionless at the exact same spot in the sky forever.",
    accentColor: "#9e9488",
  },
};

const CELESTIAL_INFO = PLANET_INFO;

// ═══════════════════════════════════════════════════════════════
// PLANET ORBITAL DATA
// ═══════════════════════════════════════════════════════════════
const PLANETS = [
  { name:"Mercury",radius:0.6,  distance:9,  speed:0.047,tilt:0.03,                 atmosColor:"#b0a090",atmosInt:0.3,moons:[] },
  { name:"Venus",  radius:1.2,  distance:14, speed:0.035,tilt:177.4*(Math.PI/180),  atmosColor:"#e8b840",atmosInt:0.9,moons:[] },
  { name:"Earth",  radius:1.3,  distance:21, speed:0.029,tilt:23.4*(Math.PI/180),   atmosColor:"#4488ff",atmosInt:0.8,
    moons:[{name:"Moon",radius:0.32,distance:2.4,speed:0.22}] },
  { name:"Mars",   radius:0.85, distance:30, speed:0.024,tilt:25.2*(Math.PI/180),   atmosColor:"#cc6633",atmosInt:0.4,
    moons:[{name:"Phobos",radius:0.2,distance:1.8,speed:0.32},{name:"Deimos",radius:0.16,distance:2.5,speed:0.22}] },
  { name:"Jupiter",radius:4.2,  distance:48, speed:0.013,tilt:3.1*(Math.PI/180),    atmosColor:"#d4a870",atmosInt:0.5,
    moons:[
      {name:"Io",radius:0.35,distance:5.5,speed:0.2},
      {name:"Europa",radius:0.3,distance:6.8,speed:0.16},
      {name:"Ganymede",radius:0.42,distance:8.2,speed:0.12},
      {name:"Callisto",radius:0.38,distance:9.8,speed:0.09}
    ] },
  { name:"Saturn", radius:3.5,  distance:68, speed:0.0096,tilt:26.7*(Math.PI/180),  atmosColor:"#e8d890",atmosInt:0.4,
    moons:[
      {name:"Titan",radius:0.45,distance:5.8,speed:0.14},
      {name:"Enceladus",radius:0.22,distance:7.2,speed:0.19}
    ] },
  { name:"Uranus", radius:2.4,  distance:84, speed:0.0068,tilt:97.8*(Math.PI/180),  atmosColor:"#70e8e8",atmosInt:0.6,moons:[] },
  { name:"Neptune",radius:2.3,  distance:98, speed:0.0054,tilt:28.3*(Math.PI/180),  atmosColor:"#3355ff",atmosInt:0.7,
    moons:[{name:"Triton",radius:0.38,distance:4.5,speed:0.18}] },
] as const;

// ═══════════════════════════════════════════════════════════════
// ORBIT RING
// ═══════════════════════════════════════════════════════════════
function OrbitRing({ radius }: { radius: number }) {
  const lineRef = useRef<THREE.Line>(null!);
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 512; i++) {
      const a = (i / 512) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.07 }), []);
  const obj = useMemo(() => new THREE.Line(geo, mat), [geo, mat]);
  return <primitive object={obj} ref={lineRef} />;
}

// ═══════════════════════════════════════════════════════════════
// SATURN RINGS (realistic bands + Cassini division)
// ═══════════════════════════════════════════════════════════════
function SaturnRings({ radius }: { radius: number }) {
  const tex = useMemo(() => {
    const w = 1024, h = 4, canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const t = x / w;
      let r = 0, g = 0, b = 0, a = 0;
      if (t < 0.18) { const v = 0.12 + Math.abs(Math.sin(t * 60)) * 0.08; r=160;g=140;b=100;a=v; }
      else if (t < 0.20) { a = 0; }
      else if (t < 0.52) { const band=Math.abs(Math.sin(t*140))*.4+Math.abs(Math.sin(t*55+1.2))*.3; r=220;g=200;b=140;a=0.55+band*.35; }
      else if (t < 0.57) { a=0.04;r=80;g=70;b=50; }
      else if (t < 0.82) { const band=Math.abs(Math.sin(t*110))*.3+Math.abs(Math.sin(t*38+.7))*.2; const encke=(t>.715&&t<.735)?.05:1; r=210;g=190;b=135;a=(0.45+band*.35)*encke; }
      else if (t < 0.87) { const s=(t>.833&&t<.843)?.7:0; r=230;g=210;b=150;a=s; }
      else { a=0; }
      ctx.fillStyle=`rgba(${r},${g},${b},${a})`; ctx.fillRect(x,0,1,h);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }, []);
  const geo = useMemo(() => {
    const inner = radius * 1.18, outer = radius * 2.42;
    const g = new THREE.RingGeometry(inner, outer, 320, 1);
    const pos = g.attributes.position, uv = g.attributes.uv, v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v3.fromBufferAttribute(pos,i); uv.setXY(i,(v3.length()-inner)/(outer-inner),0.5); }
    uv.needsUpdate = true; return g;
  }, [radius]);
  return (
    <mesh geometry={geo} rotation={[Math.PI/2,0,0]}>
      <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// URANUS RINGS (3 thin concentric rings)
// ═══════════════════════════════════════════════════════════════
function UranusRings({ radius }: { radius: number }) {
  const defs = useMemo(() => [
    { ir: radius*1.50, or: radius*1.535, op: 0.22, col: "#99cccc" },
    { ir: radius*1.60, or: radius*1.625, op: 0.16, col: "#88bbbb" },
    { ir: radius*1.72, or: radius*1.755, op: 0.20, col: "#aacccc" },
  ], [radius]);
  return (
    <>
      {defs.map((d, i) => (
        <mesh key={i} geometry={new THREE.RingGeometry(d.ir, d.or, 128)} rotation={[Math.PI/2,0,0]}>
          <meshBasicMaterial color={d.col} transparent opacity={d.op} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// PLANET MOON (main scene)
// ═══════════════════════════════════════════════════════════════
function PlanetMoon({
  name,
  parentName,
  radius,
  distance,
  speed,
  timeRef,
  offset,
  onSelect,
  onHover,
  onHoverEnd,
}: {
  name: string;
  parentName: string;
  radius: number;
  distance: number;
  speed: number;
  timeRef: React.MutableRefObject<number>;
  offset: number;
  onSelect: (name: string) => void;
  onHover: (name: string, x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const tex = useMemo(() => textures[name]?.() ?? textures.Moon(), [name]);

  useFrame(() => {
    const t = timeRef.current * speed + offset;
    ref.current.position.set(Math.cos(t) * distance, 0, Math.sin(t) * distance);
    ref.current.rotation.y += 0.006;
  });

  return (
    <mesh
      ref={ref}
      scale={hovered ? 1.3 : 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
        onHover(name, e.clientX, e.clientY);
      }}
      onPointerMove={(e) => onHover(name, e.clientX, e.clientY)}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
        onHoverEnd();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(name);
      }}
    >
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial map={tex} roughness={0.8} metalness={0} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// PLANET (main solar system)
// ═══════════════════════════════════════════════════════════════
function Planet({ data, timeRef, index, onSelect, onHover, onHoverEnd }: {
  data: typeof PLANETS[number];
  timeRef: React.MutableRefObject<number>;
  index: number;
  onSelect: (name: string) => void;
  onHover: (name: string, x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef  = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const phase = useMemo(() => (index * Math.PI * 2) / PLANETS.length, [index]);
  const tex   = useMemo(() => textures[data.name]?.() ?? textures.Mercury(), [data.name]);
  const bump  = useMemo(() => textures[data.name]?.() ?? textures.Mercury(), [data.name]);
  const atmosColor = useMemo(() => new THREE.Color(data.atmosColor), [data.atmosColor]);

  useFrame(() => {
    const t = timeRef.current * data.speed + phase;
    groupRef.current.position.set(Math.cos(t)*data.distance, 0, Math.sin(t)*data.distance);
    meshRef.current.rotation.y += 0.003 + index * 0.0002;
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        rotation={[0, 0, data.tilt ?? 0]}
        scale={hovered ? 1.09 : 1}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor="pointer"; onHover(data.name, e.clientX, e.clientY); }}
        onPointerMove={(e) => onHover(data.name, e.clientX, e.clientY)}
        onPointerOut={() => { setHovered(false); document.body.style.cursor="default"; onHoverEnd(); }}
        onClick={(e) => { e.stopPropagation(); onSelect(data.name); }}
      >
        <sphereGeometry args={[data.radius, 80, 80]} />
        <meshStandardMaterial map={tex} bumpMap={bump} bumpScale={0.06} roughness={0.68} metalness={0.05} />
        {data.name === "Saturn" && <SaturnRings radius={data.radius} />}
        {data.name === "Uranus" && <UranusRings radius={data.radius} />}
      </mesh>

      {/* Atmosphere glow — sibling, FrontSide + AdditiveBlending */}
      <mesh scale={hovered ? 1.24 : 1.18}>
        <sphereGeometry args={[data.radius, 32, 32]} />
        <atmosphereShaderMat
          glowColor={atmosColor}
          intensity={hovered ? data.atmosInt * 1.7 : data.atmosInt}
          transparent={true} depthWrite={false}
          side={THREE.FrontSide} blending={THREE.AdditiveBlending}
        />
      </mesh>

      {data.moons.map((m, mi) => (
        <PlanetMoon
          key={m.name}
          name={m.name}
          parentName={data.name}
          radius={m.radius}
          distance={m.distance}
          speed={m.speed}
          timeRef={timeRef}
          offset={(mi * Math.PI * 2) / data.moons.length}
          onSelect={onSelect}
          onHover={onHover}
          onHoverEnd={onHoverEnd}
        />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUN
// ═══════════════════════════════════════════════════════════════
function Sun({
  onSelect,
  onHover,
  onHoverEnd,
}: {
  onSelect: (name: string) => void;
  onHover: (name: string, x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const matRef  = useRef<THREE.ShaderMaterial & { time: number }>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.time = clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.0008;
      coreRef.current.scale.setScalar((hovered ? 1.05 : 1) + Math.sin(clock.getElapsedTime() * 0.6) * 0.008);
    }
  });

  return (
    <>
      <mesh
        ref={coreRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
          onHover("Sun", e.clientX, e.clientY);
        }}
        onPointerMove={(e) => onHover("Sun", e.clientX, e.clientY)}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
          onHoverEnd();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("Sun");
        }}
      >
        <sphereGeometry args={[5.5, 128, 128]} />
        <sunMat ref={matRef} time={0} />
      </mesh>
      {[7.5, 9.5, 12.5, 17].map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[r, 32, 32]} />
          <meshBasicMaterial color={i<2?"#FF7700":"#FF4400"} transparent opacity={[0.055,0.03,0.015,0.007][i]} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      ))}
      <pointLight color="#FFFDF2" intensity={42} distance={550} decay={0.4} />
      <pointLight color="#FFAA33" intensity={20} distance={180} decay={0.6} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// ASTEROID BELT (5 Unique 3D Asteroid Geometries — Zero Square Particles)
// ═══════════════════════════════════════════════════════════════
function AsteroidSubMesh({
  geo,
  count,
  minRadius,
  maxRadius,
}: {
  geo: THREE.BufferGeometry;
  count: number;
  minRadius: number;
  maxRadius: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const colors = [
      new THREE.Color("#2f2b27"), // dark carbonaceous
      new THREE.Color("#423d37"), // deep basalt
      new THREE.Color("#564c41"), // dark chondrite
      new THREE.Color("#6e6254"), // stony grey-brown
      new THREE.Color("#7f7262"), // silicate regolith
      new THREE.Color("#8e8272"), // weathered surface
      new THREE.Color("#5c4c3e"), // iron-nickel rust
    ];

    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const t = (Math.random() + Math.random()) * 0.5;
      const radius = minRadius + t * (maxRadius - minRadius);
      const y = (Math.random() - 0.5) * (Math.random() - 0.5) * 3.4;
      // Diverse scales: micro gravel (0.07-0.18) to landmark boulders (0.35-0.75)
      const baseScale = 0.07 + Math.pow(Math.random(), 3.2) * 0.65;
      const scaleX = baseScale * (0.7 + Math.random() * 0.6);
      const scaleY = baseScale * (0.7 + Math.random() * 0.6);
      const scaleZ = baseScale * (0.7 + Math.random() * 0.6);
      const rotX = Math.random() * Math.PI * 2;
      const rotY = Math.random() * Math.PI * 2;
      const rotZ = Math.random() * Math.PI * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];

      arr.push({
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius,
        rotX, rotY, rotZ,
        scaleX, scaleY, scaleZ,
        color,
      });
    }
    return arr;
  }, [count, minRadius, maxRadius]);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const d = data[i];
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(d.rotX, d.rotY, d.rotZ);
      dummy.scale.set(d.scaleX, d.scaleY, d.scaleZ);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, d.color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data, count, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, count]}>
      <meshStandardMaterial roughness={0.85} metalness={0.12} />
    </instancedMesh>
  );
}

function AsteroidBeltGroup({
  geos,
  countPerGeo,
  minRadius,
  maxRadius,
  speed,
  timeRef,
}: {
  geos: THREE.BufferGeometry[];
  countPerGeo: number;
  minRadius: number;
  maxRadius: number;
  speed: number;
  timeRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = timeRef.current * speed;
    }
  });

  return (
    <group ref={groupRef}>
      {geos.map((geo, i) => (
        <AsteroidSubMesh
          key={i}
          geo={geo}
          count={countPerGeo}
          minRadius={minRadius}
          maxRadius={maxRadius}
        />
      ))}
    </group>
  );
}

function AsteroidBelt({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  // Shape 1: Sharp multifaceted angular rock
  const geoJagged = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.7, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 6.5 + v.y * 4.2) * 0.24 + Math.cos(v.z * 5.1 + v.x * 3.4) * 0.2;
      v.multiplyScalar(0.85 + n);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Shape 2: Oblong elongated tumbling asteroid (Eros / Itokawa style)
  const geoPotato = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.65, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.x *= 1.85;
      v.y *= 0.85;
      v.z *= 0.75;
      const bump = (Math.sin(v.x * 4.0) + Math.cos(v.y * 3.5)) * 0.12;
      v.multiplyScalar(1.0 + bump);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Shape 3: Cratered boulder with deep impact gouge (Mathilde / Phobos style)
  const geoCratered = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.7, 1);
    const pos = geo.attributes.position;
    const crater = new THREE.Vector3(0.6, 0.4, 0.3).normalize();
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const d = v.clone().normalize().distanceTo(crater);
      let factor = 1.0;
      if (d < 0.75) {
        factor = 0.62 + Math.sin(d * Math.PI) * 0.24;
      }
      const noise = Math.sin(v.x * 5.2 + v.z * 7.1) * 0.12;
      v.multiplyScalar(factor + noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Shape 4: Contact-binary dumbbell rock with neck pinch (Arrokoth / Kleopatra style)
  const geoBinary = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.65, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const pinch = 1.0 - 0.52 * Math.exp(-(v.x * v.x) / 0.15);
      v.y *= pinch;
      v.z *= pinch;
      v.x *= 1.7;
      const bump = Math.sin(v.x * 5.0 + v.y * 6.0) * 0.08;
      v.multiplyScalar(1.0 + bump);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Shape 5: Flat chiseled splinter slab (angular thin fragment)
  const geoShard = useMemo(() => {
    const geo = new THREE.TetrahedronGeometry(0.8, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.y *= 0.35;
      v.x += v.z * 0.35;
      const noise = Math.sin(v.x * 8.0 + v.z * 6.0) * 0.14;
      v.multiplyScalar(1.0 + noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const uniqueGeos = useMemo(
    () => [geoJagged, geoPotato, geoCratered, geoBinary, geoShard],
    [geoJagged, geoPotato, geoCratered, geoBinary, geoShard]
  );

  return (
    <>
      {/* Inner asteroid belt (320 instances per shape = 1,600 3D asteroids) */}
      <AsteroidBeltGroup
        geos={uniqueGeos}
        countPerGeo={320}
        minRadius={34.5}
        maxRadius={39.2}
        speed={0.017}
        timeRef={timeRef}
      />
      {/* Outer asteroid belt (320 instances per shape = 1,600 3D asteroids) */}
      <AsteroidBeltGroup
        geos={uniqueGeos}
        countPerGeo={320}
        minRadius={39.0}
        maxRadius={44.8}
        speed={0.013}
        timeRef={timeRef}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// GUIDED TOUR DATA & TOUR DIRECTOR
// ═══════════════════════════════════════════════════════════════
export interface TourStop {
  target: string;
  title: string;
  desc: string;
  camPos: [number, number, number];
  targetPos: [number, number, number];
}

const TOUR_STOPS: TourStop[] = [
  { target: "Sun", title: "The Sun — Solar Heart", desc: "A 4.6-billion-year-old yellow dwarf star holding 99.86% of all mass in the Solar System.", camPos: [0, 16, 36], targetPos: [0, 0, 0] },
  { target: "Mercury", title: "Mercury — Sun-Baked World", desc: "Innermost planet, swinging from 430°C in sunlight to -180°C in night-time shadows.", camPos: [11, 5, 12], targetPos: [9, 0, 0] },
  { target: "Venus", title: "Venus — Runaway Greenhouse", desc: "Shrouded in sulfuric acid clouds with crushing 92-atm surface pressure.", camPos: [16, 6, 17], targetPos: [14, 0, 0] },
  { target: "Earth", title: "Earth & Moon — Oasis of Life", desc: "The only known haven for life, crowned with liquid oceans and our companion Moon.", camPos: [23, 5, 24], targetPos: [21, 0, 0] },
  { target: "ISS", title: "ISS — Humanity's Outpost", desc: "Orbiting 408 km above Earth at 27,600 km/h, continuously crewed for over 23 years.", camPos: [22.2, 1.6, 22.2], targetPos: [21, 0, 0] },
  { target: "JWST", title: "JWST — Peering to Cosmic Dawn", desc: "Stationed at Sun-Earth L2, Webb's gold mirrors capture light from the very first galaxies.", camPos: [25, 3.8, 26], targetPos: [23.6, 0, 0] },
  { target: "Mars", title: "Mars — The Red Frontier", desc: "Host to the Solar System's tallest volcano (Olympus Mons) and monumental ancient canyons.", camPos: [32, 7, 34], targetPos: [30, 0, 0] },
  { target: "Ceres", title: "Ceres — Queen of the Asteroids", desc: "Largest world in the asteroid belt, harboring subsurface brine and bright sodium salt spots.", camPos: [40, 8, 41], targetPos: [38.5, 0, 0] },
  { target: "Jupiter", title: "Jupiter — King of Planets", desc: "Twice as massive as all other planets combined, with its iconic Great Red Spot.", camPos: [52, 14, 56], targetPos: [48, 0, 0] },
  { target: "Saturn", title: "Saturn — Jewel of the Solar System", desc: "Surrounded by magnificent razor-thin rings of billions of water-ice crystals.", camPos: [72, 18, 76], targetPos: [68, 0, 0] },
  { target: "Uranus", title: "Uranus — The Tilted Ice Giant", desc: "Knocked sideways at a dramatic 98° tilt, rolling along its orbit like a bowling ball.", camPos: [88, 18, 92], targetPos: [84, 0, 0] },
  { target: "Neptune", title: "Neptune — Supersonic Storm Realm", desc: "Cobalt blue atmosphere swept by supersonic winds exceeding 2,100 km/h.", camPos: [102, 20, 106], targetPos: [98, 0, 0] },
  { target: "Pluto", title: "Pluto & Charon — Binary Kingdom", desc: "A double-dwarf-planet system at the Kuiper Belt threshold with towering nitrogen glaciers.", camPos: [116, 22, 118], targetPos: [114, 0, 0] },
  { target: "Halley", title: "Halley's Comet — Cosmic Wanderer", desc: "Venting volatile gas and dust into spectacular dual tails on its 76-year journey.", camPos: [42, 18, 44], targetPos: [38, 0, 0] },
  { target: "Voyager 1", title: "Voyager 1 — Interstellar Emissary", desc: "Over 24 billion km from Earth in pristine interstellar space, bearing humanity's Golden Record.", camPos: [118, 42, -80], targetPos: [115, 38, -85] },
];

function TourDirector({
  tourActive,
  tourStep,
  controlsRef,
}: {
  tourActive: boolean;
  tourStep: number;
  controlsRef: React.RefObject<any>;
}) {
  useFrame(({ camera }, delta) => {
    if (!tourActive) return;
    const stop = TOUR_STOPS[tourStep] || TOUR_STOPS[0];
    const targetCam = new THREE.Vector3(...stop.camPos);
    const targetLook = new THREE.Vector3(...stop.targetPos);

    camera.position.lerp(targetCam, delta * 1.6);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook, delta * 2.2);
      controlsRef.current.update();
    }
  });
  return null;
}

// ═══════════════════════════════════════════════════════════════
// WEB AUDIO AMBIENT SPACE DRONE
// ═══════════════════════════════════════════════════════════════
class SpaceAudioDrone {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isPlaying = false;

  public toggle(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Deep celestial drone 54 Hz
      const sub = this.ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(54, this.ctx.currentTime);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start();

      // Cosmic resonance 108 Hz
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(108, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(360, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start();

      // Ethereal overtone shimmer 432 Hz
      const shimmer = this.ctx.createOscillator();
      shimmer.type = "sine";
      shimmer.frequency.setValueAtTime(432, this.ctx.currentTime);
      const shimmerGain = this.ctx.createGain();
      shimmerGain.gain.setValueAtTime(0.035, this.ctx.currentTime);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.masterGain);
      shimmer.start();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.masterGain?.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.3);
      this.isPlaying = false;
    } else {
      this.masterGain?.gain.setTargetAtTime(0.22, this.ctx.currentTime, 0.6);
      this.isPlaying = true;
    }
    return this.isPlaying;
  }
}
const spaceAudio = new SpaceAudioDrone();

// ═══════════════════════════════════════════════════════════════
// HABITABLE "GOLDILOCKS" ZONE
// ═══════════════════════════════════════════════════════════════
function HabitableZone() {
  const innerR = 18.2;
  const outerR = 25.4;

  const innerPts = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * innerR, 0, Math.sin(a) * innerR));
    }
    return pts;
  }, [innerR]);

  const outerPts = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * outerR, 0, Math.sin(a) * outerR));
    }
    return pts;
  }, [outerR]);

  const innerGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(innerPts), [innerPts]);
  const outerGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(outerPts), [outerPts]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[innerR, outerR, 128]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <primitive object={new THREE.Line(innerGeo, new THREE.LineBasicMaterial({ color: "#10b981", transparent: true, opacity: 0.45 }))} />
      <primitive object={new THREE.Line(outerGeo, new THREE.LineBasicMaterial({ color: "#10b981", transparent: true, opacity: 0.45 }))} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// DWARF PLANETS (Ceres in Asteroid Belt & Pluto/Charon Binary)
// ═══════════════════════════════════════════════════════════════
function DwarfPlanets({
  timeRef,
  onSelect,
  onHover,
  onHoverEnd,
}: {
  timeRef: React.MutableRefObject<number>;
  onSelect: (name: string) => void;
  onHover: (name: string, x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const ceresRef = useRef<THREE.Group>(null!);
  const plutoGroupRef = useRef<THREE.Group>(null!);
  const plutoMeshRef = useRef<THREE.Mesh>(null!);
  const charonMeshRef = useRef<THREE.Mesh>(null!);

  const ceresTex = useMemo(() => textures.Ceres(), []);
  const plutoTex = useMemo(() => textures.Pluto(), []);
  const charonTex = useMemo(() => textures.Charon(), []);

  useFrame(() => {
    const t = timeRef.current;

    // Ceres in Asteroid Belt (dist 38.5, speed 0.017)
    if (ceresRef.current) {
      const angle = t * 0.017 + 1.2;
      ceresRef.current.position.set(Math.cos(angle) * 38.5, Math.sin(angle * 1.5) * 1.4, Math.sin(angle) * 38.5);
      ceresRef.current.rotation.y += 0.012;
    }

    // Pluto & Charon (dist 114, speed 0.0045, inclination 17 deg)
    if (plutoGroupRef.current) {
      const angle = t * 0.0045 + 2.8;
      const r = 114;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = Math.sin(angle) * (r * 0.29); // ~17 deg inclination
      plutoGroupRef.current.position.set(x, y, z);
    }

    if (plutoMeshRef.current) plutoMeshRef.current.rotation.y += 0.004;

    // Charon orbits Pluto at local radius 1.75
    if (charonMeshRef.current) {
      const cAngle = t * 0.15;
      charonMeshRef.current.position.set(Math.cos(cAngle) * 1.75, Math.sin(cAngle * 0.5) * 0.3, Math.sin(cAngle) * 1.75);
      charonMeshRef.current.rotation.y += 0.004;
    }
  });

  return (
    <>
      {/* Ceres Orbit Ring */}
      <OrbitRing radius={38.5} />

      {/* Ceres Mesh */}
      <group ref={ceresRef}>
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); onHover("Ceres", e.clientX, e.clientY); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { onHoverEnd(); document.body.style.cursor = "default"; }}
          onClick={(e) => { e.stopPropagation(); onSelect("Ceres"); }}
        >
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial map={ceresTex} roughness={0.9} metalness={0.05} />
        </mesh>
      </group>

      {/* Pluto & Charon Orbit Ring (inclined group) */}
      <group rotation={[0.29, 0, 0]}>
        <OrbitRing radius={114} />
      </group>

      {/* Pluto & Charon Binary System Group */}
      <group ref={plutoGroupRef}>
        {/* Pluto */}
        <mesh
          ref={plutoMeshRef}
          onPointerOver={(e) => { e.stopPropagation(); onHover("Pluto", e.clientX, e.clientY); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { onHoverEnd(); document.body.style.cursor = "default"; }}
          onClick={(e) => { e.stopPropagation(); onSelect("Pluto"); }}
        >
          <sphereGeometry args={[0.54, 48, 48]} />
          <meshStandardMaterial map={plutoTex} roughness={0.8} metalness={0.02} />
        </mesh>

        {/* Charon */}
        <mesh
          ref={charonMeshRef}
          onPointerOver={(e) => { e.stopPropagation(); onHover("Charon", e.clientX, e.clientY); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { onHoverEnd(); document.body.style.cursor = "default"; }}
          onClick={(e) => { e.stopPropagation(); onSelect("Charon"); }}
        >
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial map={charonTex} roughness={0.85} metalness={0.02} />
        </mesh>
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMET HALLEY (Elliptical Orbit with Dynamic Dual Tails)
// ═══════════════════════════════════════════════════════════════
function CometHalley({
  timeRef,
  onSelect,
  onHover,
  onHoverEnd,
}: {
  timeRef: React.MutableRefObject<number>;
  onSelect: (name: string) => void;
  onHover: (name: string, x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const cometGroupRef = useRef<THREE.Group>(null!);
  const ionTailRef = useRef<THREE.Mesh>(null!);
  const dustTailRef = useRef<THREE.Mesh>(null!);
  const comaRef = useRef<THREE.Mesh>(null!);

  const halleyTex = useMemo(() => textures.Halley(), []);

  const a = 56;
  const e = 0.76;
  const inc = 0.31; // 18 deg inclination

  const orbitPts = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const th = (i / 256) * Math.PI * 2;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(th));
      const x = r * Math.cos(th);
      const z = r * Math.sin(th);
      const y = Math.sin(th) * (r * Math.sin(inc));
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [a, e, inc]);

  const orbitGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(orbitPts), [orbitPts]);

  useFrame(() => {
    const t = timeRef.current * 0.045;
    const th = (t % (Math.PI * 2));
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(th));
    const x = r * Math.cos(th);
    const z = r * Math.sin(th);
    const y = Math.sin(th) * (r * Math.sin(inc));

    if (cometGroupRef.current) {
      cometGroupRef.current.position.set(x, y, z);
      cometGroupRef.current.rotation.y += 0.02;
      cometGroupRef.current.rotation.x += 0.015;

      // Tail always points away from the Sun at [0,0,0]
      const awayDir = new THREE.Vector3(x, y, z).normalize();
      const proximity = Math.max(0, 1 - r / 65);
      const tailLen = 4 + proximity * 20;

      if (ionTailRef.current) {
        ionTailRef.current.scale.set(0.35 + proximity * 0.7, tailLen, 0.35 + proximity * 0.7);
        ionTailRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), awayDir);
        ionTailRef.current.position.copy(awayDir.clone().multiplyScalar(tailLen * 0.5));
      }

      if (dustTailRef.current) {
        const dustDir = awayDir.clone().add(new THREE.Vector3(-z, 0, x).normalize().multiplyScalar(0.42)).normalize();
        dustTailRef.current.scale.set(0.7 + proximity * 1.3, tailLen * 0.75, 0.7 + proximity * 1.3);
        dustTailRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dustDir);
        dustTailRef.current.position.copy(dustDir.clone().multiplyScalar(tailLen * 0.38));
      }

      if (comaRef.current) {
        const cScale = 0.6 + proximity * 1.4;
        comaRef.current.scale.setScalar(cScale);
      }
    }
  });

  return (
    <>
      <primitive
        object={new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.35 }))}
      />
      <group ref={cometGroupRef}>
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); onHover("Halley", e.clientX, e.clientY); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { onHoverEnd(); document.body.style.cursor = "default"; }}
          onClick={(e) => { e.stopPropagation(); onSelect("Halley"); }}
        >
          <dodecahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial map={halleyTex} roughness={0.95} metalness={0.1} />
        </mesh>
        <mesh ref={comaRef}>
          <sphereGeometry args={[0.55, 24, 24]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh ref={ionTailRef}>
          <coneGeometry args={[0.35, 1, 16, 1, true]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh ref={dustTailRef}>
          <coneGeometry args={[0.7, 1, 16, 1, true]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.25} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORIC SPACECRAFT & PROBES (ISS, JWST, Voyager 1)
// ═══════════════════════════════════════════════════════════════
function SpacecraftProbes({
  timeRef,
  onSelect,
  onHover,
  onHoverEnd,
}: {
  timeRef: React.MutableRefObject<number>;
  onSelect: (name: string) => void;
  onHover: (name: string, x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const issRef = useRef<THREE.Group>(null!);
  const jwstRef = useRef<THREE.Group>(null!);
  const voyagerRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const t = timeRef.current;

    const earthAngle = t * 0.029;
    const earthX = Math.cos(earthAngle) * 21;
    const earthZ = Math.sin(earthAngle) * 21;

    // ISS orbiting Earth
    if (issRef.current) {
      const issAngle = t * 0.8;
      const localX = Math.cos(issAngle) * 1.85;
      const localZ = Math.sin(issAngle) * 1.85;
      const localY = Math.sin(issAngle * 1.2) * 0.4;
      issRef.current.position.set(earthX + localX, localY, earthZ + localZ);
      issRef.current.rotation.y += 0.01;
    }

    // JWST at Sun-Earth L2 (dist 23.6)
    if (jwstRef.current) {
      const l2R = 23.6;
      const haloAngle = t * 0.2;
      const lx = Math.cos(earthAngle) * l2R + Math.cos(haloAngle) * 0.4;
      const lz = Math.sin(earthAngle) * l2R + Math.sin(haloAngle) * 0.4;
      const ly = Math.sin(haloAngle * 1.5) * 0.35;
      jwstRef.current.position.set(lx, ly, lz);
      jwstRef.current.lookAt(0, 0, 0);
    }

    // Voyager 1 in deep interstellar space
    if (voyagerRef.current) {
      voyagerRef.current.rotation.y += 0.003;
    }
  });

  return (
    <>
      {/* ISS */}
      <group
        ref={issRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover("ISS", e.clientX, e.clientY); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHoverEnd(); document.body.style.cursor = "default"; }}
        onClick={(e) => { e.stopPropagation(); onSelect("ISS"); }}
      >
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.38, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.75, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.32, 0, 0]}>
          <boxGeometry args={[0.24, 0.01, 0.16]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0.32, 0, 0]}>
          <boxGeometry args={[0.24, 0.01, 0.16]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* JWST */}
      <group
        ref={jwstRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover("JWST", e.clientX, e.clientY); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHoverEnd(); document.body.style.cursor = "default"; }}
        onClick={(e) => { e.stopPropagation(); onSelect("JWST"); }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.7, 0.02, 0.45]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.03, 6]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.98} roughness={0.05} />
        </mesh>
        <mesh position={[0, 0.35, 0.12]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Voyager 1 */}
      <group
        ref={voyagerRef}
        position={[115, 38, -85]}
        onPointerOver={(e) => { e.stopPropagation(); onHover("Voyager 1", e.clientX, e.clientY); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHoverEnd(); document.body.style.cursor = "default"; }}
        onClick={(e) => { e.stopPropagation(); onSelect("Voyager 1"); }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.1, 0.12, 24, 1, true]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <coneGeometry args={[0.08, 0.25, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.15]}>
          <boxGeometry args={[0.3, 0.25, 0.22]} />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0.65, 0, -0.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 1.1, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.4, 0, -0.15]} rotation={[0, 0, -Math.PI / 3]}>
          <cylinderGeometry args={[0.04, 0.04, 0.45, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCENE
// ═══════════════════════════════════════════════════════════════
function Scene({
  onSelect,
  onHover,
  onHoverEnd,
  speedRef,
  showHabitableZone,
  showOrbits,
  tourActive,
  tourStep,
}: {
  onSelect: (name: string) => void;
  onHover: (name: string, x: number, y: number) => void;
  onHoverEnd: () => void;
  speedRef: React.MutableRefObject<number>;
  showHabitableZone: boolean;
  showOrbits: boolean;
  tourActive: boolean;
  tourStep: number;
}) {
  const timeRef = useRef(0);
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => { timeRef.current += delta * speedRef.current; });

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#0c1026", 0.4]} />
      <Stars radius={350} depth={100} count={15000} factor={5} saturation={0.15} fade speed={0.2} />

      {/* Orbit Rings (toggleable) */}
      {showOrbits && PLANETS.map(p => <OrbitRing key={p.name} radius={p.distance} />)}

      {/* Habitable Goldilocks Zone (toggleable) */}
      {showHabitableZone && <HabitableZone />}

      {/* The Sun */}
      <Sun onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd} />

      {/* Asteroid Belt with 3,200 unique 3D irregular bodies */}
      <AsteroidBelt timeRef={timeRef} />

      {/* Dwarf Planets: Ceres in belt & Pluto/Charon binary */}
      <DwarfPlanets timeRef={timeRef} onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd} />

      {/* Historic Spacecraft: ISS, JWST, Voyager 1 */}
      <SpacecraftProbes timeRef={timeRef} onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd} />

      {/* Comet Halley with dynamic dual ion and dust tails */}
      <CometHalley timeRef={timeRef} onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd} />

      {/* Major Planets & Moons */}
      {PLANETS.map((p, i) => (
        <Planet key={p.name} data={p} timeRef={timeRef} index={i}
          onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd} />
      ))}

      {/* Guided Tour Camera Fly-by Director */}
      <TourDirector tourActive={tourActive} tourStep={tourStep} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        zoomSpeed={0.9}
        panSpeed={0.5}
        rotateSpeed={0.35}
        minDistance={5}
        maxDistance={350}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — DETAIL MOON (orbiting in planet detail scene)
// ═══════════════════════════════════════════════════════════════
function DetailMoon({
  name,
  radius,
  distance,
  speed,
  timeRef,
  offset,
  onSelect,
}: {
  name: string;
  radius: number;
  distance: number;
  speed: number;
  timeRef: React.MutableRefObject<number>;
  offset: number;
  onSelect?: (name: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const tex = useMemo(() => textures[name]?.() ?? textures.Moon(), [name]);

  useFrame(() => {
    const t = timeRef.current * speed + offset;
    ref.current.position.set(Math.cos(t) * distance, Math.sin(t) * distance * 0.1, Math.sin(t) * distance);
    ref.current.rotation.y += 0.008;
  });

  return (
    <mesh
      ref={ref}
      scale={hovered ? 1.35 : 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(name);
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial map={tex} roughness={0.8} metalness={0} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — SUN CLOSE-UP SCENE
// ═══════════════════════════════════════════════════════════════
function SunDetailScene() {
  const matRef  = useRef<THREE.ShaderMaterial & { time: number }>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.time = clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.001;
      coreRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 0.8) * 0.012);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={35} color="#FF9900" />
      <directionalLight position={[10, 10, 10]} intensity={2.0} color="#FFFFFF" />
      <Stars radius={100} depth={50} count={3500} factor={3} saturation={0.1} fade />

      <mesh ref={coreRef}>
        <sphereGeometry args={[3.2, 128, 128]} />
        <sunMat ref={matRef} time={0} />
      </mesh>
      {[4.1, 4.9, 5.9, 7.2].map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[r, 32, 32]} />
          <meshBasicMaterial
            color={i < 2 ? "#FF8800" : "#FF4400"}
            transparent
            opacity={[0.07, 0.04, 0.02, 0.009][i]}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      <OrbitControls enablePan={false} minDistance={4.5} maxDistance={25} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — MOON CLOSE-UP SCENE
// ═══════════════════════════════════════════════════════════════
function MoonDetailScene({ name }: { name: string }) {
  const tex = useMemo(() => textures[name]?.() ?? textures.Moon(), [name]);
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.002;
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[14, 6, 9]} intensity={3.6} color="#FFFBF0" />
      <directionalLight position={[-12, -4, -8]} intensity={0.8} color="#5580b0" />
      <directionalLight position={[-4, 8, -12]} intensity={1.0} color="#a0c8ff" />
      <Stars radius={100} depth={50} count={4000} factor={3} saturation={0.1} fade />

      <mesh ref={meshRef}>
        <sphereGeometry args={[2.5, 96, 96]} />
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={0.08} roughness={0.82} metalness={0.03} />
      </mesh>

      {/* Atmospheric haze for Titan */}
      {name === "Titan" && (
        <mesh scale={1.12}>
          <sphereGeometry args={[2.5, 64, 64]} />
          <atmosphereShaderMat
            glowColor={new THREE.Color("#e89830")}
            intensity={1.0}
            transparent={true} depthWrite={false}
            side={THREE.FrontSide} blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={30} autoRotate autoRotateSpeed={0.4} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — PLANET CLOSE-UP SCENE
// ═══════════════════════════════════════════════════════════════
const DR = 2.8;

function PlanetDetailScene({
  name,
  onSelectMoon,
}: {
  name: string;
  onSelectMoon?: (moonName: string) => void;
}) {
  const data = PLANETS.find(p => p.name === name) || PLANETS[2];
  const tex   = useMemo(() => textures[name]?.() ?? textures.Mercury(), [name]);
  const bump  = useMemo(() => textures[name]?.() ?? textures.Mercury(), [name]);
  const hasCloud = name === "Earth" || name === "Venus";
  const cloudTex = useMemo(() => hasCloud ? createCloudTexture() : null, [hasCloud]);

  const meshRef  = useRef<THREE.Mesh>(null!);
  const cloudRef = useRef<THREE.Mesh>(null!);
  const timeRef  = useRef(0);
  const atmosColor = useMemo(() => new THREE.Color(data.atmosColor), [data.atmosColor]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current)  meshRef.current.rotation.y  += 0.0018;
    if (cloudRef.current) cloudRef.current.rotation.y += 0.0023;
  });

  const detailMoons = useMemo(() => data.moons.map(m => ({
    name:     m.name,
    radius:   Math.max(0.14, (m.radius / data.radius) * DR * 0.55),
    distance: DR + (m.distance / data.radius) * DR * 1.2,
    speed:    m.speed * 0.6,
  })), [data]);

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[14, 6, 9]} intensity={3.6} color="#FFFBF0" />
      <directionalLight position={[-12, -4, -8]} intensity={0.85} color="#5580b0" />
      <directionalLight position={[-4, 8, -12]} intensity={1.1} color="#a0c8ff" />
      <Stars radius={100} depth={50} count={4000} factor={3} saturation={0.1} fade />

      {/* Planet body */}
      <mesh ref={meshRef} rotation={[0, 0, data.tilt ?? 0]}>
        <sphereGeometry args={[DR, 128, 128]} />
        <meshStandardMaterial
          map={tex} bumpMap={bump} bumpScale={0.1}
          roughness={name==="Earth"?0.45:0.75} metalness={0.02}
        />
        {name === "Saturn" && <SaturnRings radius={DR} />}
        {name === "Uranus" && <UranusRings radius={DR} />}
      </mesh>

      {/* Cloud layer */}
      {cloudTex && (
        <mesh ref={cloudRef} rotation={[0, 0, data.tilt ?? 0]}>
          <sphereGeometry args={[DR * 1.016, 96, 96]} />
          <meshStandardMaterial map={cloudTex} transparent opacity={name==="Venus"?0.7:0.42} roughness={1} metalness={0} depthWrite={false} />
        </mesh>
      )}

      {/* Atmosphere */}
      <mesh scale={1.14}>
        <sphereGeometry args={[DR, 64, 64]} />
        <atmosphereShaderMat
          glowColor={atmosColor} intensity={data.atmosInt * 2.0}
          transparent={true} depthWrite={false}
          side={THREE.FrontSide} blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Moons */}
      {detailMoons.map((m, i) => (
        <DetailMoon
          key={m.name}
          name={m.name}
          radius={m.radius}
          distance={m.distance}
          speed={m.speed}
          timeRef={timeRef}
          offset={(i * Math.PI * 2) / (data.moons.length || 1)}
          onSelect={onSelectMoon}
        />
      ))}

      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={40}
        autoRotate autoRotateSpeed={0.4} rotateSpeed={0.5} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — PLUTO & CHARON CLOSE-UP
// ═══════════════════════════════════════════════════════════════
function PlutoDetailScene({ onSelect }: { onSelect: (name: string) => void }) {
  const plutoTex = useMemo(() => textures.Pluto(), []);
  const charonTex = useMemo(() => textures.Charon(), []);
  const charonOrbitRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (charonOrbitRef.current) {
      charonOrbitRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[12, 6, 8]} intensity={3.0} color="#FFFBF0" />
      <directionalLight position={[-10, -4, -6]} intensity={0.7} color="#5580b0" />
      <Stars radius={100} depth={50} count={3500} factor={3} saturation={0.1} fade />

      {/* Pluto with Sputnik Planitia Heart */}
      <mesh>
        <sphereGeometry args={[2.2, 96, 96]} />
        <meshStandardMaterial map={plutoTex} roughness={0.8} metalness={0.02} />
      </mesh>

      {/* Charon orbiting Pluto */}
      <group ref={charonOrbitRef}>
        <group position={[5.6, 0.3, 0]}>
          <mesh
            onClick={(e) => { e.stopPropagation(); onSelect("Charon"); }}
            onPointerOver={() => { document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "default"; }}
          >
            <sphereGeometry args={[1.05, 48, 48]} />
            <meshStandardMaterial map={charonTex} roughness={0.85} metalness={0.02} />
          </mesh>
        </group>
      </group>

      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={30} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — CERES CLOSE-UP
// ═══════════════════════════════════════════════════════════════
function CeresDetailScene() {
  const ceresTex = useMemo(() => textures.Ceres(), []);
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[12, 6, 8]} intensity={3.2} color="#FFFBF0" />
      <directionalLight position={[-10, -4, -6]} intensity={0.8} color="#5580b0" />
      <Stars radius={100} depth={50} count={3500} factor={3} saturation={0.1} fade />

      <mesh ref={meshRef}>
        <sphereGeometry args={[2.5, 96, 96]} />
        <meshStandardMaterial map={ceresTex} roughness={0.88} metalness={0.04} />
      </mesh>

      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={30} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — COMET HALLEY CLOSE-UP
// ═══════════════════════════════════════════════════════════════
function CometDetailScene() {
  const halleyTex = useMemo(() => textures.Halley(), []);
  const nucleusRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (nucleusRef.current) {
      nucleusRef.current.rotation.y += delta * 0.2;
      nucleusRef.current.rotation.x += delta * 0.12;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[14, 8, 10]} intensity={3.5} color="#FFFBF0" />
      <directionalLight position={[-10, -4, -8]} intensity={0.9} color="#38bdf8" />
      <Stars radius={100} depth={50} count={4000} factor={3} saturation={0.15} fade />

      {/* Tumbling Dark Nucleus */}
      <mesh ref={nucleusRef}>
        <dodecahedronGeometry args={[2.2, 2]} />
        <meshStandardMaterial map={halleyTex} roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Luminous Expanding Coma */}
      <mesh>
        <sphereGeometry args={[3.4, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.8, 32, 32]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Active Sublimating Gas Geysers */}
      {[
        [1.8, 1.2, 0.8],
        [-1.6, 1.4, -0.6],
        [0.8, -1.8, 1.1],
        [-1.2, -1.2, -1.4],
      ].map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          <mesh>
            <coneGeometry args={[0.3, 2.2, 16]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}

      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={30} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW — HISTORIC SPACECRAFT CLOSE-UP
// ═══════════════════════════════════════════════════════════════
function SpacecraftDetailScene({ name }: { name: string }) {
  const modelRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (modelRef.current) modelRef.current.rotation.y += delta * 0.25;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[12, 10, 10]} intensity={3.5} color="#FFFBF0" />
      <directionalLight position={[-10, -6, -8]} intensity={1.2} color="#475569" />
      <Stars radius={100} depth={50} count={3500} factor={3} saturation={0.1} fade />

      <group ref={modelRef} scale={1.8}>
        {name === "Voyager 1" && (
          <group>
            {/* Parabolic Antenna Dish */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[2.2, 0.4, 0.45, 32, 1, true]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.35} side={THREE.DoubleSide} />
            </mesh>
            {/* Feed horn */}
            <mesh position={[0, 0, 0.75]}>
              <coneGeometry args={[0.25, 0.9, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Equipment Bus */}
            <mesh position={[0, 0, -0.55]}>
              <cylinderGeometry args={[1.1, 1.1, 0.7, 10]} />
              <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Golden Record on the side */}
            <mesh position={[1.12, 0, -0.55]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.98} roughness={0.1} />
            </mesh>
            {/* Magnetometer Boom */}
            <mesh position={[2.6, 0, -0.55]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 4.2, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* RTG Power Boom */}
            <mesh position={[-1.6, 0, -0.55]} rotation={[0, 0, -Math.PI / 3]}>
              <cylinderGeometry args={[0.16, 0.16, 1.8, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )}

        {name === "JWST" && (
          <group>
            {/* 5-layer Silver/Rose Sunshield */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[4.2, 0.06, 2.6]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.92} roughness={0.12} />
            </mesh>
            {/* Iconic 18 Hexagonal Gold Mirrors (Honeycomb pattern) */}
            <group position={[0, 0.8, 0]}>
              {[-1, 0, 1].map((row) =>
                [-1.2, -0.6, 0, 0.6, 1.2].map((col, cIdx) => (
                  <mesh key={`${row}-${cIdx}`} position={[col * 0.7, row * 0.65, 0]} rotation={[0, 0, Math.PI / 6]}>
                    <cylinderGeometry args={[0.34, 0.34, 0.05, 6]} />
                    <meshStandardMaterial color="#f59e0b" metalness={0.98} roughness={0.04} />
                  </mesh>
                ))
              )}
            </group>
            {/* Secondary Mirror Support Tripod */}
            <mesh position={[0, 1.8, 1.2]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.1} />
            </mesh>
          </group>
        )}

        {name === "ISS" && (
          <group>
            {/* Central Pressurized Modules */}
            <mesh>
              <cylinderGeometry args={[0.35, 0.35, 2.4, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.65} roughness={0.35} />
            </mesh>
            {/* Main Cross Truss */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.12, 0.12, 5.2, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
            </mesh>
            {/* 8 Solar Panels (4 on left, 4 on right) */}
            {[-2.0, -1.2, 1.2, 2.0].map((xPos, idx) => (
              <group key={idx} position={[xPos, 0, 0]}>
                <mesh position={[0, 0, 0.9]}>
                  <boxGeometry args={[0.65, 0.04, 1.5]} />
                  <meshStandardMaterial color="#1d4ed8" metalness={0.85} roughness={0.15} />
                </mesh>
                <mesh position={[0, 0, -0.9]}>
                  <boxGeometry args={[0.65, 0.04, 1.5]} />
                  <meshStandardMaterial color="#1d4ed8" metalness={0.85} roughness={0.15} />
                </mesh>
              </group>
            ))}
          </group>
        )}
      </group>

      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={25} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MASTER CELESTIAL DETAIL SCENE ROUTER
// ═══════════════════════════════════════════════════════════════
function CelestialDetailScene({
  name,
  onSelect,
}: {
  name: string;
  onSelect: (name: string) => void;
}) {
  if (name === "Sun") return <SunDetailScene />;
  if (name === "Halley") return <CometDetailScene />;
  if (name === "Pluto") return <PlutoDetailScene onSelect={onSelect} />;
  if (name === "Ceres") return <CeresDetailScene />;
  if (name === "Voyager 1" || name === "JWST" || name === "ISS") {
    return <SpacecraftDetailScene name={name} />;
  }
  if (CELESTIAL_INFO[name]?.parentPlanet) return <MoonDetailScene name={name} />;
  return <PlanetDetailScene name={name} onSelectMoon={onSelect} />;
}

// ═══════════════════════════════════════════════════════════════
// UI — STAT CARD
// ═══════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, delay = 0 }: {
  icon: string; label: string; value: string; delay?: number;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", borderRadius: 12,
      padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)",
      animation: `fadeInUp 0.5s ease-out ${delay}s both`,
    }}>
      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6, fontWeight: 600 }}>
        {icon} {label}
      </div>
      <div style={{ color: "#f0f0f0", fontSize: 15, fontWeight: 700, fontFamily: "monospace", lineHeight: 1.3 }}>
        {value}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UI — PLANET / CELESTIAL STATS PANEL
// ═══════════════════════════════════════════════════════════════
function PlanetStatsPanel({
  name,
  onClose,
  onSelect,
  previousObject,
  onOpenComparison,
}: {
  name: string;
  onClose: () => void;
  onSelect: (name: string) => void;
  previousObject?: string | null;
  onOpenComparison?: (name: string) => void;
}) {
  const info = CELESTIAL_INFO[name] || CELESTIAL_INFO.Earth;
  const ac = info.accentColor;
  const planetData = PLANETS.find(p => p.name === name);
  const moons = planetData?.moons || [];

  const backLabel = previousObject
    ? `← Back to ${previousObject}`
    : info.parentPlanet
    ? `← Back to ${info.parentPlanet}`
    : "← Back to Solar System";

  return (
    <div className="stats-scroll" style={{
      width: "100%", height: "100%",
      background: "rgba(4, 6, 18, 0.92)",
      backdropFilter: "blur(28px)",
      WebkitBackdropFilter: "blur(28px)",
      borderLeft: `1px solid ${ac}28`,
      padding: "36px 28px 60px",
      overflowY: "auto",
      boxSizing: "border-box",
      animation: "slideInRight 0.45s cubic-bezier(0.22,1,0.36,1)",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      color: "#fff",
      position: "relative",
    }}>
      {/* Top action bar: Close/Back & Compare Scale */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "8px 16px", color: "rgba(255,255,255,0.7)",
          cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
          transition: "all 0.2s",
        }}
          onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color="#fff"; (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.12)"; }}
          onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color="rgba(255,255,255,0.7)"; (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.06)"; }}
        >
          {backLabel}
        </button>

        {onOpenComparison && (
          <button
            onClick={() => onOpenComparison(name)}
            style={{
              background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.35)",
              borderRadius: 8, padding: "8px 14px", color: "#38bdf8",
              cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
              fontWeight: 600, transition: "all 0.2s",
            }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background="rgba(56,189,248,0.22)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background="rgba(56,189,248,0.12)"; }}
          >
            ⚖ Compare Scale
          </button>
        )}
      </div>

      {/* Accent line */}
      <div style={{ width: 48, height: 3, background: `linear-gradient(90deg,${ac},transparent)`, borderRadius: 3, margin: "28px 0 20px" }} />

      {/* Celestial Name */}
      <h1 style={{ fontSize: 50, fontWeight: 800, color: ac, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1, animation: "fadeInUp 0.4s ease-out 0.05s both" }}>
        {info.isSun ? "The Sun" : name}
      </h1>

      {/* Type badge */}
      <span style={{
        background: `${ac}1a`, border: `1px solid ${ac}50`, color: ac,
        borderRadius: 20, padding: "5px 15px", fontSize: 11,
        fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
        display: "inline-block", animation: "fadeInUp 0.4s ease-out 0.1s both",
      }}>
        {info.parentPlanet ? `Moon of ${info.parentPlanet}` : info.type}
      </span>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "28px 0" }}>
        {info.isSun ? (
          <>
            <StatCard icon="⌀" label="Diameter"       value={info.diameter}       delay={0.12} />
            <StatCard icon="⚖" label="Total Mass"      value={info.mass || ""}     delay={0.16} />
            <StatCard icon="🔥" label="Core Temp"      value={info.coreTemp || ""} delay={0.20} />
            <StatCard icon="☀" label="Surface Temp"   value={info.surfaceTemp || ""} delay={0.24} />
            <StatCard icon="🔄" label="Rot. Period"    value={info.dayLength}      delay={0.28} />
            <StatCard icon="⏱" label="Age"             value={info.age || ""}      delay={0.32} />
            <StatCard icon="↓" label="Gravity"          value={info.gravity}        delay={0.36} />
            <StatCard icon="💨" label="Composition"    value={info.atmosphere}     delay={0.40} />
          </>
        ) : info.parentPlanet ? (
          <>
            <StatCard icon="⌀" label="Diameter"       value={info.diameter}       delay={0.12} />
            <StatCard icon="🪐" label="Host Planet"    value={info.parentPlanet}   delay={0.16} />
            <StatCard icon="📏" label="Orbit Dist."    value={info.distancePlanet || ""} delay={0.20} />
            <StatCard icon="🔄" label="Orbit Period"   value={info.orbitalPeriod}  delay={0.24} />
            <StatCard icon="⏱" label="Day Length"      value={info.dayLength}      delay={0.28} />
            <StatCard icon="🌡" label="Temperature"    value={info.temperature}    delay={0.32} />
            <StatCard icon="↓" label="Gravity"          value={info.gravity}        delay={0.36} />
            <StatCard icon="💨" label="Atmosphere"      value={info.atmosphere}     delay={0.40} />
          </>
        ) : (
          <>
            <StatCard icon="⌀" label="Diameter"       value={info.diameter}       delay={0.12} />
            <StatCard icon="☀" label="Dist. from Sun"  value={info.distanceSun || ""} delay={0.16} />
            <StatCard icon="🔄" label="Year Length"    value={info.orbitalPeriod}  delay={0.20} />
            <StatCard icon="⏱" label="Day Length"      value={info.dayLength}      delay={0.24} />
            <StatCard icon="🌡" label="Temperature"    value={info.temperature}    delay={0.28} />
            <StatCard icon="↓" label="Gravity"          value={info.gravity}        delay={0.32} />
            <StatCard icon="🌙" label="Moons"           value={String(info.moonCount ?? 0)} delay={0.36} />
            <StatCard icon="💨" label="Atmosphere"      value={info.atmosphere}     delay={0.40} />
          </>
        )}
      </div>

      {/* Clickable Moons Navigation Chips (when viewing a planet with moons) */}
      {moons.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "16px 18px", margin: "0 0 24px",
          animation: "fadeInUp 0.5s ease-out 0.42s both",
        }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
            🌙 Moons of {name} (Click to inspect)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {moons.map((m) => (
              <button
                key={m.name}
                onClick={() => onSelect(m.name)}
                style={{
                  background: `${ac}18`, border: `1px solid ${ac}45`,
                  borderRadius: 20, padding: "7px 14px",
                  color: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = `${ac}35`;
                  e.currentTarget.style.borderColor = ac;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = `${ac}18`;
                  e.currentTarget.style.borderColor = `${ac}45`;
                  e.currentTarget.style.transform = "none";
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: ac }} />
                {m.name} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0 20px" }} />

      {/* Description */}
      <p style={{
        color: "rgba(255,255,255,0.68)", lineHeight: 1.75, fontSize: 14,
        marginBottom: 22, animation: "fadeInUp 0.5s ease-out 0.45s both",
      }}>
        {info.description}
      </p>

      {/* Fun fact */}
      <div style={{
        background: `${ac}12`, border: `1px solid ${ac}30`,
        borderRadius: 14, padding: "18px 20px",
        animation: "fadeInUp 0.5s ease-out 0.55s both",
      }}>
        <div style={{ color: ac, fontWeight: 800, fontSize: 11, marginBottom: 10, letterSpacing: "0.14em" }}>
          ★ DID YOU KNOW
        </div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.65 }}>
          {info.funFact}
        </div>
      </div>

      {/* Bottom tag */}
      <div style={{ marginTop: 32, color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", letterSpacing: "0.1em" }}>
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UI — PLANETARY COMPARISON MODAL
// ═══════════════════════════════════════════════════════════════
const COMPARISON_BODIES = [
  "Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter",
  "Saturn", "Uranus", "Neptune", "Pluto", "Ceres", "Moon",
  "Titan", "Halley", "ISS", "JWST", "Voyager 1"
];

function PlanetaryComparisonModal({
  initialTargetA,
  onClose,
  onSelect,
}: {
  initialTargetA?: string | null;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const [bodyA, setBodyA] = useState(initialTargetA || "Earth");
  const [bodyB, setBodyB] = useState(initialTargetA === "Jupiter" ? "Earth" : "Jupiter");

  const infoA = CELESTIAL_INFO[bodyA] || CELESTIAL_INFO.Earth;
  const infoB = CELESTIAL_INFO[bodyB] || CELESTIAL_INFO.Jupiter;

  const getRadiusKm = (name: string) => {
    switch (name) {
      case "Sun": return 696340;
      case "Jupiter": return 69911;
      case "Saturn": return 58232;
      case "Uranus": return 25362;
      case "Neptune": return 24622;
      case "Earth": return 6371;
      case "Venus": return 6052;
      case "Mars": return 3390;
      case "Mercury": return 2440;
      case "Titan": return 2575;
      case "Moon": return 1737;
      case "Pluto": return 1188;
      case "Ceres": return 470;
      case "Halley": return 8;
      default: return 500;
    }
  };

  const rA = getRadiusKm(bodyA);
  const rB = getRadiusKm(bodyB);
  const maxR = Math.max(rA, rB);
  const visualScaleA = Math.max(26, Math.min(180, (rA / maxR) * 180));
  const visualScaleB = Math.max(26, Math.min(180, (rB / maxR) * 180));
  const ratio = (rA / rB).toFixed(2);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(2, 4, 15, 0.88)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, animation: "fadeIn 0.3s ease-out",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 860, maxHeight: "90vh",
        background: "rgba(10, 15, 32, 0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 24, padding: "32px 36px",
        overflowY: "auto", position: "relative",
        boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <span>⚖</span> Celestial Scale Comparison
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "4px 0 0" }}>
              Direct side-by-side scientific comparison and relative size visualization
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%", width: 36, height: 36, color: "#fff",
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {[
            ["Earth", "Mars"],
            ["Earth", "Jupiter"],
            ["Sun", "Earth"],
            ["Earth", "Moon"],
            ["Pluto", "Moon"],
            ["Venus", "Earth"],
          ].map(([pA, pB]) => (
            <button
              key={`${pA}-${pB}`}
              onClick={() => { setBodyA(pA); setBodyB(pB); }}
              style={{
                background: bodyA === pA && bodyB === pB ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)",
                border: bodyA === pA && bodyB === pB ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, padding: "6px 14px", color: bodyA === pA && bodyB === pB ? "#38bdf8" : "rgba(255,255,255,0.7)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {pA} vs {pB}
            </button>
          ))}
        </div>

        {/* Visual Scale Display */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18, padding: "28px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-around", marginBottom: 28, minHeight: 220, position: "relative",
        }}>
          {/* Body A Sphere */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{
              width: visualScaleA, height: visualScaleA, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${infoA.accentColor}, #0a0e1c)`,
              boxShadow: `0 0 32px ${infoA.accentColor}55`,
              transition: "all 0.4s ease-out",
            }} />
            <select
              value={bodyA}
              onChange={(e) => setBodyA(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.1)", border: `1px solid ${infoA.accentColor}`,
                color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 14, fontWeight: 700,
                outline: "none", cursor: "pointer",
              }}
            >
              {COMPARISON_BODIES.map(b => <option key={b} value={b} style={{ background: "#0c1026" }}>{b}</option>)}
            </select>
          </div>

          {/* Scale ratio badge in center */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>
              {ratio}×
            </span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Diameter Ratio
            </span>
          </div>

          {/* Body B Sphere */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{
              width: visualScaleB, height: visualScaleB, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${infoB.accentColor}, #0a0e1c)`,
              boxShadow: `0 0 32px ${infoB.accentColor}55`,
              transition: "all 0.4s ease-out",
            }} />
            <select
              value={bodyB}
              onChange={(e) => setBodyB(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.1)", border: `1px solid ${infoB.accentColor}`,
                color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 14, fontWeight: 700,
                outline: "none", cursor: "pointer",
              }}
            >
              {COMPARISON_BODIES.map(b => <option key={b} value={b} style={{ background: "#0c1026" }}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Metrics Comparative Table */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color: infoA.accentColor, fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>{bodyA}</span>
              <button
                onClick={() => { onClose(); onSelect(bodyA); }}
                style={{ background: "transparent", border: "none", color: infoA.accentColor, cursor: "pointer", fontSize: 11, textDecoration: "underline" }}
              >
                Inspect 3D →
              </button>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div><strong>Diameter:</strong> {infoA.diameter}</div>
              <div><strong>Gravity:</strong> {infoA.gravity}</div>
              <div><strong>Day Length:</strong> {infoA.dayLength}</div>
              <div><strong>Orbital Period:</strong> {infoA.orbitalPeriod}</div>
              <div><strong>Temperature:</strong> {infoA.temperature}</div>
              <div><strong>Atmosphere:</strong> {infoA.atmosphere}</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color: infoB.accentColor, fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>{bodyB}</span>
              <button
                onClick={() => { onClose(); onSelect(bodyB); }}
                style={{ background: "transparent", border: "none", color: infoB.accentColor, cursor: "pointer", fontSize: 11, textDecoration: "underline" }}
              >
                Inspect 3D →
              </button>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div><strong>Diameter:</strong> {infoB.diameter}</div>
              <div><strong>Gravity:</strong> {infoB.gravity}</div>
              <div><strong>Day Length:</strong> {infoB.dayLength}</div>
              <div><strong>Orbital Period:</strong> {infoB.orbitalPeriod}</div>
              <div><strong>Temperature:</strong> {infoB.temperature}</div>
              <div><strong>Atmosphere:</strong> {infoB.atmosphere}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UI — GUIDED TOUR OVERLAY HUD
// ═══════════════════════════════════════════════════════════════
function TourOverlayHUD({
  tourStep,
  onPrev,
  onNext,
  onExit,
  onInspect,
}: {
  tourStep: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  onInspect: (target: string) => void;
}) {
  const current = TOUR_STOPS[tourStep] || TOUR_STOPS[0];
  const total = TOUR_STOPS.length;

  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 40, width: "90%", maxWidth: 640,
      background: "rgba(4, 8, 24, 0.9)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(56, 189, 248, 0.35)",
      borderRadius: 20, padding: "18px 24px",
      boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 24px rgba(56,189,248,0.15)",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      animation: "fadeIn 0.3s ease-out",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 10px #38bdf8" }} />
          <span style={{ color: "#38bdf8", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            CINEMATIC TOUR · STOP {tourStep + 1} OF {total}
          </span>
        </div>
        <button
          onClick={onExit}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6, padding: "4px 10px", color: "rgba(255,255,255,0.6)",
            fontSize: 12, cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseOver={e => (e.currentTarget.style.color = "#fff")}
          onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        >
          Exit Tour ✕
        </button>
      </div>

      <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
        {current.title}
      </h3>
      <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 16px" }}>
        {current.desc}
      </p>

      {/* Progress & Nav Buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={onPrev}
          disabled={tourStep === 0}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8, padding: "6px 14px", color: tourStep === 0 ? "rgba(255,255,255,0.25)" : "#fff",
            fontSize: 13, cursor: tourStep === 0 ? "not-allowed" : "pointer", fontWeight: 600,
          }}
        >
          ◀ Previous
        </button>

        <button
          onClick={() => onInspect(current.target)}
          style={{
            background: "rgba(56,189,248,0.16)", border: "1px solid rgba(56,189,248,0.4)",
            borderRadius: 8, padding: "6px 16px", color: "#38bdf8",
            fontSize: 13, cursor: "pointer", fontWeight: 700,
          }}
        >
          🔍 Inspect in Detail
        </button>

        <button
          onClick={onNext}
          disabled={tourStep === total - 1}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8, padding: "6px 14px", color: tourStep === total - 1 ? "rgba(255,255,255,0.25)" : "#fff",
            fontSize: 13, cursor: tourStep === total - 1 ? "not-allowed" : "pointer", fontWeight: 600,
          }}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UI — BOTTOM HUD
// ═══════════════════════════════════════════════════════════════
const SPEEDS = [0.25, 0.5, 1, 2, 5, 10];

function BottomHUD({
  speedMult, setSpeedMult,
  paused, setPaused,
  selectedBody,
  showHabitableZone, setShowHabitableZone,
  showOrbits, setShowOrbits,
  tourActive, setTourActive,
  audioActive, onToggleAudio,
  onOpenComparison,
}: {
  speedMult: number; setSpeedMult: (v: number) => void;
  paused: boolean; setPaused: (v: boolean) => void;
  selectedBody: string | null;
  showHabitableZone: boolean; setShowHabitableZone: (v: boolean | ((p: boolean) => boolean)) => void;
  showOrbits: boolean; setShowOrbits: (v: boolean | ((p: boolean) => boolean)) => void;
  tourActive: boolean; setTourActive: (v: boolean | ((p: boolean) => boolean)) => void;
  audioActive: boolean; onToggleAudio: () => void;
  onOpenComparison: () => void;
}) {
  return (
    <div style={{
      position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(5,10,25,0.85)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 50,
      padding: "8px 18px", zIndex: 20,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      boxShadow: "0 8px 36px rgba(0,0,0,0.6)",
    }}>
      {/* Play/pause */}
      <button onClick={() => setPaused(!paused)} title={paused?"Play":"Pause"} style={{
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "50%", width: 34, height: 34, cursor: "pointer", color: "#fff",
        fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s", flexShrink: 0,
      }}
        onMouseOver={e=>(e.currentTarget.style.background="rgba(255,255,255,0.18)")}
        onMouseOut={e=>(e.currentTarget.style.background="rgba(255,255,255,0.1)")}
      >
        {paused ? "▶" : "⏸"}
      </button>

      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

      {/* Speed presets */}
      {SPEEDS.map(s => (
        <button key={s} onClick={() => { setSpeedMult(s); setPaused(false); }} style={{
          background: speedMult===s && !paused ? "rgba(255,255,255,0.18)" : "transparent",
          border: speedMult===s && !paused ? "1px solid rgba(255,255,255,0.28)" : "1px solid transparent",
          borderRadius: 50, padding: "4px 10px", cursor: "pointer",
          color: speedMult===s && !paused ? "#fff" : "rgba(255,255,255,0.38)",
          fontSize: 12, fontWeight: speedMult===s && !paused ? 700 : 400,
          fontFamily: "monospace", transition: "all 0.2s",
        }}
          onMouseOver={e=>(e.currentTarget.style.color="#fff")}
          onMouseOut={e=>{ if(!(speedMult===s&&!paused)) (e.currentTarget.style.color="rgba(255,255,255,0.38)"); }}
        >
          {s}×
        </button>
      ))}

      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

      {/* Habitable Zone Toggle */}
      <button
        onClick={() => setShowHabitableZone(prev => !prev)}
        style={{
          background: showHabitableZone ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
          border: showHabitableZone ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.1)",
          color: showHabitableZone ? "#10b981" : "rgba(255,255,255,0.6)",
          borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        🌿 Habitable
      </button>

      {/* Orbit Rings Toggle */}
      <button
        onClick={() => setShowOrbits(prev => !prev)}
        style={{
          background: showOrbits ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.06)",
          border: showOrbits ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
          color: showOrbits ? "#38bdf8" : "rgba(255,255,255,0.6)",
          borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        🪐 Orbits
      </button>

      {/* Guided Tour Mode Toggle */}
      <button
        onClick={() => setTourActive(prev => !prev)}
        style={{
          background: tourActive ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.06)",
          border: tourActive ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
          color: tourActive ? "#000" : "rgba(255,255,255,0.8)",
          borderRadius: 20, padding: "5px 13px", fontSize: 12, fontWeight: 700,
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        🚀 {tourActive ? "In Tour" : "Tour"}
      </button>

      {/* Scale Comparison Button */}
      <button
        onClick={onOpenComparison}
        style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.75)", borderRadius: 20, padding: "5px 12px",
          fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        ⚖ Compare
      </button>

      {/* Ambient Audio Drone Toggle */}
      <button
        onClick={onToggleAudio}
        title="Cosmic Web Audio Drone"
        style={{
          background: audioActive ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.06)",
          border: audioActive ? "1px solid #c084fc" : "1px solid rgba(255,255,255,0.1)",
          color: audioActive ? "#c084fc" : "rgba(255,255,255,0.6)",
          borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        {audioActive ? "🔊 Audio ON" : "🔇 Audio"}
      </button>

      {!selectedBody && !tourActive && (
        <>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.32)", fontSize: 12, whiteSpace: "nowrap", animation: "pulse 3s ease-in-out infinite" }}>
            Click Sun, planet, moon or probe to explore
          </span>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOVER TOOLTIP
// ═══════════════════════════════════════════════════════════════
function HoverTooltip({ name, x, y, accent }: { name: string; x: number; y: number; accent: string }) {
  return (
    <div style={{
      position: "fixed", left: x + 18, top: y - 14, pointerEvents: "none", zIndex: 30,
      background: "rgba(4,7,20,0.92)", backdropFilter: "blur(10px)",
      border: `1px solid ${accent}50`, borderRadius: 8,
      padding: "7px 15px", display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "-apple-system,sans-serif", letterSpacing: "0.04em" }}>
        {name}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
export default function SolarSystemPage() {
  const [selectedBody, setSelectedBody] = useState<string | null>(null);
  const [previousBody, setPreviousBody] = useState<string | null>(null);
  const [hoveredBody,  setHoveredBody]  = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [speedMult, setSpeedMult] = useState(1);
  const [paused, setPaused] = useState(false);

  // Interactive Feature States
  const [showHabitableZone, setShowHabitableZone] = useState(false);
  const [showOrbits, setShowOrbits] = useState(true);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonTarget, setComparisonTarget] = useState<string | null>(null);
  const [audioActive, setAudioActive] = useState(false);

  const speedRef = useRef(1);
  useEffect(() => { speedRef.current = paused ? 0 : speedMult; }, [speedMult, paused]);

  const handleToggleAudio = () => {
    const isPlaying = spaceAudio.toggle();
    setAudioActive(isPlaying);
  };

  const handleSelect = (name: string) => {
    if (selectedBody && selectedBody !== name) {
      setPreviousBody(selectedBody);
    } else {
      setPreviousBody(null);
    }
    setSelectedBody(name);
  };

  const handleClose = () => {
    if (previousBody && CELESTIAL_INFO[selectedBody || ""]?.parentPlanet === previousBody) {
      setSelectedBody(previousBody);
      setPreviousBody(null);
    } else {
      setSelectedBody(null);
      setPreviousBody(null);
    }
  };

  const handleOpenComparison = (target?: string) => {
    setComparisonTarget(target || selectedBody || "Earth");
    setShowComparison(true);
  };

  const hoveredInfo = hoveredBody ? CELESTIAL_INFO[hoveredBody] : null;
  const hoverDisplayName = hoveredBody
    ? hoveredInfo?.parentPlanet
      ? `${hoveredBody} (${hoveredInfo.parentPlanet}'s Moon)`
      : hoveredBody === "Sun"
      ? "The Sun"
      : hoveredBody
    : "";

  return (
    <div
      style={{ width: "100vw", height: "100vh", background: "#00000a", position: "relative", overflow: "hidden" }}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* ── Main Solar System Canvas ── */}
      <Canvas
        camera={{ position: [0, 52, 108], fov: 52, near: 0.1, far: 1200 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      >
        <Scene
          onSelect={handleSelect}
          onHover={(name, x, y) => { setHoveredBody(name); setMousePos({ x, y }); }}
          onHoverEnd={() => setHoveredBody(null)}
          speedRef={speedRef}
          showHabitableZone={showHabitableZone}
          showOrbits={showOrbits}
          tourActive={tourActive}
          tourStep={tourStep}
        />
      </Canvas>

      {/* ── Hover tooltip ── */}
      {hoveredBody && !selectedBody && !tourActive && hoveredInfo && (
        <HoverTooltip name={hoverDisplayName} x={mousePos.x} y={mousePos.y} accent={hoveredInfo.accentColor} />
      )}

      {/* ── Cinematic Guided Tour HUD ── */}
      {tourActive && !selectedBody && (
        <TourOverlayHUD
          tourStep={tourStep}
          onPrev={() => setTourStep(prev => Math.max(0, prev - 1))}
          onNext={() => setTourStep(prev => Math.min(TOUR_STOPS.length - 1, prev + 1))}
          onExit={() => setTourActive(false)}
          onInspect={(target) => handleSelect(target)}
        />
      )}

      {/* ── Planet / Celestial Detail Overlay ── */}
      {selectedBody && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", zIndex: 10,
          animation: "fadeIn 0.35s ease-out",
          background: "rgba(0,0,8,0.72)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}>
          {/* Left — 3D close-up canvas (Sun, Planet, Moon, Comet, Spacecraft) */}
          <div style={{ flex: "0 0 56%", height: "100%", background: "#020510" }}>
            <Canvas
              camera={{ position: [0, 1.5, 13], fov: 55, near: 0.1, far: 200 }}
              gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.45 }}
              style={{ width: "100%", height: "100%" }}
            >
              <CelestialDetailScene name={selectedBody} onSelect={handleSelect} />
            </Canvas>
          </div>

          {/* Right — Stats panel */}
          <div style={{ flex: "0 0 44%", height: "100%", overflowY: "auto" }}>
            <PlanetStatsPanel
              name={selectedBody}
              onClose={handleClose}
              onSelect={handleSelect}
              previousObject={previousBody}
              onOpenComparison={handleOpenComparison}
            />
          </div>
        </div>
      )}

      {/* ── Planetary Comparison Modal ── */}
      {showComparison && (
        <PlanetaryComparisonModal
          initialTargetA={comparisonTarget}
          onClose={() => setShowComparison(false)}
          onSelect={handleSelect}
        />
      )}

      {/* ── Bottom HUD ── */}
      <BottomHUD
        speedMult={speedMult} setSpeedMult={setSpeedMult}
        paused={paused} setPaused={setPaused}
        selectedBody={selectedBody}
        showHabitableZone={showHabitableZone}
        setShowHabitableZone={setShowHabitableZone}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        tourActive={tourActive}
        setTourActive={setTourActive}
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        onOpenComparison={() => handleOpenComparison()}
      />
    </div>
  );
}
