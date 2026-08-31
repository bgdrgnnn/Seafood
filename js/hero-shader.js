// ===== Bahari Seafood — Hero Animated Gradient (WebGL) =====
// Vanilla-JS port of a React "Velaris" component: a WebGL shader that
// blends several colors together with layered simplex noise, plus a
// vignette and film grain, into a slowly-drifting animated gradient.
// The React wrapper (props/hooks) doesn't apply on this static site, so
// only the framework-agnostic WebGL/GLSL core is ported, painted onto
// .hero-mesh's own canvas instead of a full-viewport one. Falls back to
// .hero-mesh's CSS gradient when WebGL is unavailable — the canvas is
// simply left blank/transparent, so that gradient shows through.

(function () {
  const VERTEX_SRC = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SRC = `
    precision highp float;
    varying vec2 vUv;

    uniform vec2  u_resolution;
    uniform float u_time;
    uniform float u_grain;
    uniform vec3  u_colors[4];
    uniform vec3  u_bg;

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      float ratio = u_resolution.x / u_resolution.y;
      vec2 p = uv - 0.5;
      p.x *= ratio;

      float t = u_time * 0.1;

      float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
      float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
      float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

      vec3 col = u_bg;

      float dist = length(p) * 1.5;
      float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

      col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
      col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.32);
      col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.55);
      col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.2);

      float glow = smoothstep(0.8, 0.0, dist) * 0.16;
      col += u_colors[1] * glow;

      col = mix(col * 0.2, col, vignette);

      float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
      col += (grain - 0.5) * u_grain * 0.1;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // Brand palette (css/style.css) — navy-led with gold worked in through
  // the noise blend, matching the rest of the site instead of the
  // component's original green defaults.
  const BG = "#081A2E"; // --navy-deep
  const COLORS = ["#0F2A4A", "#D4A017", "#173F68", "#8A6A1F"];
  const SPEED = 0.6; // slow, elegant drift — not the demo's fast churn
  const GRAIN = 0.12; // subtle texture, not a gritty film-grain look

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function init() {
    const canvas = document.getElementById("heroShaderCanvas");
    const container = document.querySelector(".hero-mesh");
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return; // .hero-mesh's CSS gradient stays visible as the fallback.

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function createShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, VERTEX_SRC));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FRAGMENT_SRC));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      res: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      grain: gl.getUniformLocation(program, "u_grain"),
      colors: gl.getUniformLocation(program, "u_colors"),
      bg: gl.getUniformLocation(program, "u_bg"),
    };

    const bgRgb = hexToRgb(BG);
    const colorsFlat = new Float32Array(COLORS.flatMap(hexToRgb));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, container.clientWidth * dpr);
      canvas.height = Math.max(1, container.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function draw(timeSeconds) {
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, timeSeconds * SPEED);
      gl.uniform1f(locs.grain, GRAIN);
      gl.uniform3f(locs.bg, bgRgb[0], bgRgb[1], bgRgb[2]);
      gl.uniform3fv(locs.colors, colorsFlat);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (reduceMotion) {
      draw(0);
      return;
    }

    let raf;
    function render(tMs) {
      draw(tMs * 0.001);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    // Pause the animation loop while the hero is scrolled out of view —
    // it's a tall section and this shader would otherwise keep costing a
    // frame budget for the rest of the page's lifetime.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          const visible = entries[0].isIntersecting;
          if (visible && !raf) {
            raf = requestAnimationFrame(render);
          } else if (!visible && raf) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        },
        { threshold: 0 }
      );
      io.observe(container);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
