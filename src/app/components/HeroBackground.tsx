"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Domain-warped FBM — vibrant brand colours matching the original hero
const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2  u_res;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = dot(hash2(i)             - 0.5, f);
  float b = dot(hash2(i + vec2(1,0)) - 0.5, f - vec2(1,0));
  float c = dot(hash2(i + vec2(0,1)) - 0.5, f - vec2(0,1));
  float d = dot(hash2(i + vec2(1,1)) - 0.5, f - vec2(1,1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p  = rot * p * 2.02 + vec2(100.0);
    a *= 0.5;
  }
  return v * 0.5 + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.x *= u_res.x / u_res.y;

  float t = u_time * 0.04;

  // domain warp — two passes
  vec2 q = vec2(fbm(uv + t * 0.8),
                fbm(uv + vec2(5.2, 1.3) + t));
  vec2 r = vec2(fbm(uv + 2.8 * q + vec2(1.7, 9.2) + 0.13 * t),
                fbm(uv + 2.8 * q + vec2(8.3, 2.8) + 0.10 * t));

  float f = fbm(uv + 3.2 * r + 0.07 * t);

  // ── palette — matches original hero colours ──────────────────
  vec3 navy    = vec3(0.008, 0.010, 0.180); // #020230  deep navy
  vec3 royalBg = vec3(0.055, 0.075, 0.310); // mid-navy layer
  vec3 blue    = vec3(0.251, 0.357, 0.941); // #405af0  brand blue
  vec3 skyBlue = vec3(0.380, 0.520, 0.980); // lighter electric blue
  vec3 green   = vec3(0.227, 0.722, 0.455); // #3ab874  brand green
  vec3 teal    = vec3(0.176, 0.824, 0.745); // cyan-teal highlight

  // layer colours by f value — vivid, not smoky
  vec3 col = navy;
  col = mix(col, royalBg, smoothstep(0.28, 0.48, f));
  col = mix(col, blue,    smoothstep(0.42, 0.62, f));
  col = mix(col, skyBlue, smoothstep(0.56, 0.72, f));
  col = mix(col, green,   smoothstep(0.64, 0.80, f) * 0.55);
  col = mix(col, teal,    smoothstep(0.74, 0.90, f) * 0.30);

  // bright highlight streaks at peaks
  col += vec3(0.20, 0.32, 0.90) * smoothstep(0.80, 1.00, f) * 0.55;

  // keep left side (text area) darker so text stays legible
  float leftDark = smoothstep(0.55, 0.0, uv.x / (u_res.x / u_res.y));
  col *= mix(1.0, 0.38, leftDark);

  // subtle vignette at very edges
  vec2 vig = (gl_FragCoord.xy / u_res - 0.5) * 2.0;
  col *= 1.0 - dot(vig, vig) * 0.18;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    // Compile + link
    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes  = gl.getUniformLocation(prog, "u_res");

    // Resize handler
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Render loop
    let rafId: number;
    const start = performance.now();
    const render = () => {
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}
