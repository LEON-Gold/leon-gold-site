"use client";
// The hero's moving ground: liquid metal behind the jewel, gold on the vault at the top of the page turning to emerald as
// the pinned hero is scrolled through, with gold sparks rising through it (faster on a fast scroll). Plain WebGL, no
// library. It starts only once the page is idle, so the first paint is the CSS hero; with reduced motion it draws one
// still frame and no sparks; with no WebGL, a low-power phone or Save-Data it never starts. It renders only while the
// hero is on screen and the tab is visible, at a pixel ratio of at most 1.5.
import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
// waves: angles .6/-.7/1.2, frequencies 2.4/3.2/4.0, weights .5/.35/.15; a wide sheen and a crisp specular on each crest
const FRAG = `precision mediump float;
uniform vec2 uRes;uniform float uTime,uScroll;
vec2 dir(float a){return vec2(cos(a),sin(a));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  float t=uTime*.08,sd=uScroll*5.;
  vec2 q=uv;q.x+=sin(uv.y*2.2+t*3.+sd*.3)*.35*.35;q.y+=cos(uv.x*1.8-t*2.2)*.25*.35;
  float w=.5*sin(dot(q,dir(.6))*2.4*1.6+t*6.+sd)+.35*sin(dot(q,dir(-.7))*3.2*1.6-t*5.+sd*.6)+.15*sin(dot(q,dir(1.2))*4.*1.6+t*8.);
  float wide=pow(max(0.,1.-abs(w-.1)),2.5),crisp=pow(max(0.,1.-abs(w-.15)),8.),crest=wide*.5+crisp*.9;
  float k=smoothstep(0.,1.,uScroll);
  vec3 sh=mix(vec3(.001,.0008,.0004),vec3(.0004,.002,.0012),k);
  vec3 wv=mix(vec3(.06,.036,.012),vec3(.004,.04,.022),k);
  vec3 cr=mix(vec3(.62,.44,.18),vec3(.36,.42,.22),k);
  vec3 col=mix(sh,wv,smoothstep(-1.,1.,w))+cr*crest*1.4*.42;
  col*=1.-dot(uv,uv)*.12;
  // a quiet pool where the name and the jewel stand, and the lower edge melts into the page's own vault
  col*=mix(.55,1.,smoothstep(.05,.55,length(uv*vec2(1.,1.3))));
  float a=smoothstep(0.,.32,gl_FragCoord.y/uRes.y);
  gl_FragColor=vec4(pow(col,vec3(1./2.2))*a,a);
}`;
const SVERT = `attribute vec4 s;uniform float uRise,uTime,uDpr;uniform vec2 uRes;varying float vA;
void main(){
  float y=fract(s.y+uRise*s.z);float x=s.x+sin(uTime*.6*s.z*6.+s.w*6.283)*.025;
  gl_Position=vec4(x*2.-1.,y*2.2-1.1,0.,1.);
  gl_PointSize=(1.5+s.w*3.5)*uDpr;
  vA=smoothstep(0.,.15,y)*(1.-smoothstep(.75,1.,y))*(.35+.65*s.w);
}`;
const SFRAG = `precision mediump float;varying float vA;
void main(){float r=length(gl_PointCoord-.5)*2.;float g=pow(max(0.,1.-r),2.);gl_FragColor=vec4(vec3(1.,.72,.32)*g*vA,1.);}`;

export default function HeroGL() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!, hero = cv.closest(".hero") as HTMLElement | null;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (!hero || nav.connection?.saveData || (nav.deviceMemory ?? 8) < 2 || (navigator.hardwareConcurrency ?? 8) < 3) return;
    let stop = () => {}, dead = false;
    const go = () => { if (!dead) stop = start(cv, hero); };
    const id = typeof requestIdleCallback === "function" ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 800) as unknown as number;
    return () => { dead = true; if (typeof cancelIdleCallback === "function") cancelIdleCallback(id); else clearTimeout(id); stop(); };
  }, []);
  return <canvas ref={ref} className="hero-gl" aria-hidden />;
}

function start(cv: HTMLCanvasElement, hero: HTMLElement): () => void {
  const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return () => {};
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches, phone = matchMedia("(max-width: 860px)").matches;
  const prog = (vs: string, fs: string) => {
    const p = gl.createProgram()!;
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(p, s); }
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };
  const wave = prog(VERT, FRAG), spark = prog(SVERT, SFRAG);
  if (!wave || !spark) return () => {};
  const tri = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  // each spark: x, start height, speed, size/brightness
  const N = still ? 0 : phone ? 120 : 300, seeds = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) seeds.set([Math.random(), Math.random(), .35 + Math.random() * .65, Math.random()], i * 4);
  const sb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sb); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const uw = { res: U(wave, "uRes"), time: U(wave, "uTime"), scroll: U(wave, "uScroll") };
  const us = { rise: U(spark, "uRise"), time: U(spark, "uTime"), dpr: U(spark, "uDpr"), res: U(spark, "uRes") };
  const aw = gl.getAttribLocation(wave, "p"), as = gl.getAttribLocation(spark, "s");

  const dpr = Math.min(devicePixelRatio || 1, phone ? 1.5 : 2);
  const size = () => { const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } gl.viewport(0, 0, w, h); };
  // the hero is pinned for two screens (Motion.tsx): that is the 0 to 1 the colours travel
  const scrollOf = () => Math.min(1, Math.max(0, scrollY / (2 * innerHeight)));
  const t0 = performance.now(); let last = t0, rise = 0, vel = 0, prev = scrollOf(), raf = 0, onScreen = true;

  const draw = (now: number) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const sc = scrollOf(); vel += (Math.abs(sc - prev) / Math.max(dt, .001) - vel) * .1; prev = sc;
    rise += dt * .05 * (1 + Math.min(vel, 3) * 9);
    const time = still ? 30 : (now - t0) / 1000;
    size();
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.useProgram(wave); gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.enableVertexAttribArray(aw); gl.vertexAttribPointer(aw, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uw.res, cv.width, cv.height); gl.uniform1f(uw.time, time); gl.uniform1f(uw.scroll, sc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (N) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(spark); gl.bindBuffer(gl.ARRAY_BUFFER, sb); gl.enableVertexAttribArray(as); gl.vertexAttribPointer(as, 4, gl.FLOAT, false, 0, 0);
      gl.uniform1f(us.rise, rise); gl.uniform1f(us.time, time); gl.uniform1f(us.dpr, dpr); gl.uniform2f(us.res, cv.width, cv.height);
      gl.drawArrays(gl.POINTS, 0, N);
    }
  };
  const loop = (now: number) => { draw(now); raf = still ? 0 : requestAnimationFrame(loop); };
  const run = () => { cancelAnimationFrame(raf); raf = 0; if (onScreen && document.visibilityState === "visible") { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); });
  io.observe(hero);
  const vis = () => run(), rs = () => { if (still) requestAnimationFrame(draw); };
  document.addEventListener("visibilitychange", vis); addEventListener("resize", rs);
  // with reduced motion the still frame follows the scroll colour too, drawn only when the page moves
  const onSc = () => { if (still && onScreen) requestAnimationFrame(draw); };
  addEventListener("scroll", onSc, { passive: true });
  cv.classList.add("on");
  run();
  return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", vis); removeEventListener("resize", rs); removeEventListener("scroll", onSc); };
}
