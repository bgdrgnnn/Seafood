// ===== Bahari Seafood — Animated Hero Gradient (WebGL) =====
// Vanilla-JS port of a React/WebGL "living gradient" component: a simplex-noise
// shader blending brand colors with a vignette and film grain. The React
// wrapper (useEffect/props/JSX) doesn't apply here — the WebGL/GLSL core is
// framework-agnostic, so it's ported directly. Falls back to the existing
// .hero-bg CSS gradient when WebGL is unavailable or motion is reduced.

(function () {

  const VERTEX_SRC = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SRC = `
    precision highp float;

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
      vec2 uv = gl_FragCoord.xy / u_resolution;
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
      col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
      col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
      col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);

      float glow = smoothstep(0.8, 0.0, dist) * 0.3;
      col += u_colors[1] * glow;

      col = mix(col * 0.2, col, vignette);

      float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
      col += (grain - 0.5) * u_grain * 0.1;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // Bahari Seafood brand palette: deep ocean navy base with teal currents.
  // Gold sits last (colors[3]) because the shader mixes it in via a noise
  // *product* (n1 * n2), which only lights up where both fields agree — so
  // it reads as rare sunlight-on-water glints rather than a dominant blob.
  const BG = '#052831';
  const COLORS = ['#0B6E7A', '#17BEBB', '#5EEAD4', '#FFB703'];
  const SPEED = 0.85;
  const GRAIN = 0.28;

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function init() {
    const canvas = document.getElementById('heroCanvas');
    const container = document.getElementById('beranda');
    if (!canvas || !container) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return; // .hero-bg CSS gradient stays visible as the fallback.

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function createShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, VERTEX_SRC);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      grain: gl.getUniformLocation(program, 'u_grain'),
      colors: gl.getUniformLocation(program, 'u_colors'),
      bg: gl.getUniformLocation(program, 'u_bg'),
    };

    const bgRgb = hexToRgb(BG);
    const colorsFlat = new Float32Array(COLORS.slice(0, 4).flatMap(hexToRgb));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(container.clientWidth * dpr));
      const height = Math.max(1, Math.round(container.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = null;
    let visible = true;

    function drawFrame(timeMs) {
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, timeMs * 0.001 * SPEED);
      gl.uniform1f(locs.grain, GRAIN);
      gl.uniform3f(locs.bg, bgRgb[0], bgRgb[1], bgRgb[2]);
      gl.uniform3fv(locs.colors, colorsFlat);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function loop(t) {
      drawFrame(t);
      raf = visible ? requestAnimationFrame(loop) : null;
    }

    if (reduceMotion) {
      drawFrame(0); // Single static frame — no continuous animation.
    } else {
      raf = requestAnimationFrame(loop);

      // Pause the render loop while the hero is scrolled out of view.
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            visible = entry.isIntersecting;
            if (visible && raf === null) raf = requestAnimationFrame(loop);
          });
        });
        io.observe(container);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
