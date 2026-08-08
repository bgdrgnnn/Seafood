// ===== Bahari Seafood — Hero Water Ripple (WebGL) =====
// Vanilla-JS port of a React "WaterRippleImage" component: a WebGL shader
// that distorts a still image with layered simplex noise to look like
// sunlight rippling across water. The React wrapper (useState/useEffect/
// file-input UI) doesn't apply here — the WebGL/GLSL core is framework-
// agnostic, so only that part is ported, sized to the hero container
// instead of the full viewport. Falls back to the existing .hero-bg CSS
// gradient when WebGL is unavailable.

(function () {

  // Resolved from this script's own URL (not the page's) so the image loads
  // correctly regardless of which directory the including HTML lives in —
  // 'images/hero-water.jpg' as a page-relative path broke on en/index.html,
  // which sits one directory deeper than js/hero-ripple.js.
  const SCRIPT_URL = document.currentScript && document.currentScript.src;
  const IMAGE_SRC = SCRIPT_URL
    ? new URL('../images/hero-water.jpg', SCRIPT_URL).href
    : 'images/hero-water.jpg';

  const VERTEX_SRC = `
    precision mediump float;
    attribute vec2 a_position;
    varying vec2 vUv;
    void main() {
      vUv = .5 * (a_position + 1.);
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SRC = `
    precision mediump float;

    varying vec2 vUv;
    uniform sampler2D u_image_texture;
    uniform float u_time;
    uniform float u_ratio;
    uniform float u_img_ratio;
    uniform float u_blueish;
    uniform float u_scale;
    uniform float u_illumination;
    uniform float u_surface_distortion;
    uniform float u_water_distortion;

    vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
    vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
    vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
      m = m*m;
      m = m*m;
      vec3 x = 2. * fract(p * C.www) - 1.;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130. * dot(m, g);
    }

    mat2 rotate2D(float r) {
      return mat2(cos(r), sin(r), -sin(r), cos(r));
    }

    float surface_noise(vec2 uv, float t, float scale) {
      vec2 n = vec2(.1);
      vec2 N = vec2(.1);
      mat2 m = rotate2D(.5);
      for (int j = 0; j < 10; j++) {
        uv *= m;
        n *= m;
        vec2 q = uv * scale + float(j) + n + (.5 + .5 * float(j)) * (mod(float(j), 2.) - 1.) * t;
        n += sin(q);
        N += cos(q) / scale;
        scale *= 1.2;
      }
      return (N.x + N.y + .1);
    }

    void main() {
      vec2 uv = vUv;
      uv.y = 1. - uv.y;
      uv.x *= u_ratio;

      float t = .002 * u_time;
      vec3 color = vec3(0.);
      float opacity = 0.;

      float outer_noise = snoise((.3 + .1 * sin(t)) * uv + vec2(0., .2 * t));
      vec2 surface_noise_uv = 2. * uv + (outer_noise * .2);

      float surf = surface_noise(surface_noise_uv, t, u_scale);
      surf *= pow(uv.y, .3);
      surf = pow(surf, 2.);

      // True CSS-"cover" fit: crop whichever axis overflows so the image
      // fills the canvas with no gaps, at any aspect ratio. (The original
      // component scaled the *matching* axis up instead of the overflowing
      // axis down, which frames a shrunken, soft-edged tile rather than a
      // full-bleed background — fine for a floating demo tile, not for a
      // hero backdrop.)
      vec2 img_uv = vUv;
      img_uv -= .5;
      if (u_ratio > u_img_ratio) {
        img_uv.y = img_uv.y * u_img_ratio / u_ratio;
      } else {
        img_uv.x = img_uv.x * u_ratio / u_img_ratio;
      }
      // edge_alpha below fades to transparent over the outer 0.02 of texture
      // space on every side ([0,0.02] and [0.98,1]). At scale_factor=1 the
      // "matching" axis above lands screen edges exactly on that boundary
      // (texture coord 0/1), i.e. fully in the fade band — going *above* 1
      // only pushes it further into the fully-transparent region beyond,
      // never past the band. Dipping slightly *below* 1 (zooming in a touch
      // more than exact cover) is what pulls the matching axis's screen-edge
      // sample back inside the opaque interior, past the fade band.
      // The ripple distortion below (img_uv += water/surface_distortion *
      // noise) nudges this coordinate by roughly +/-0.05 on top of the cover
      // fit, so the margin past the fade band needs to absorb that too, not
      // just the 0.02 band itself — otherwise the edge flickers in and out
      // of the fallback background as the animation runs.
      float scale_factor = 0.8;
      img_uv *= scale_factor;
      img_uv += .5;
      img_uv.y = 1. - img_uv.y;

      img_uv += (u_water_distortion * outer_noise);
      img_uv += (u_surface_distortion * surf);

      vec4 img = texture2D(u_image_texture, img_uv);
      img *= (1. + u_illumination * surf);

      color += img.rgb;
      color += u_illumination * vec3(1. - u_blueish, 1., 1.) * surf;
      opacity += img.a;

      float edge_width = .02;
      float edge_alpha = smoothstep(0., edge_width, img_uv.x) * smoothstep(1., 1. - edge_width, img_uv.x);
      edge_alpha *= smoothstep(0., edge_width, img_uv.y) * smoothstep(1., 1. - edge_width, img_uv.y);
      color *= edge_alpha;
      opacity *= edge_alpha;

      gl_FragColor = vec4(color, opacity);
    }
  `;

  const PARAMS = {
    blueish: 0.4,
    scale: 7,
    illumination: 0.15,
    surfaceDistortion: 0.03,
    waterDistortion: 0.02,
  };

  function init() {
    const canvas = document.getElementById('heroCanvas');
    // .hero, not #beranda — the hero section's id is localized per-language
    // (the English page uses #home), but this class name isn't.
    const container = document.querySelector('.hero');
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

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      time: gl.getUniformLocation(program, 'u_time'),
      ratio: gl.getUniformLocation(program, 'u_ratio'),
      imgRatio: gl.getUniformLocation(program, 'u_img_ratio'),
      blueish: gl.getUniformLocation(program, 'u_blueish'),
      scale: gl.getUniformLocation(program, 'u_scale'),
      illumination: gl.getUniformLocation(program, 'u_illumination'),
      surfaceDistortion: gl.getUniformLocation(program, 'u_surface_distortion'),
      waterDistortion: gl.getUniformLocation(program, 'u_water_distortion'),
      texture: gl.getUniformLocation(program, 'u_image_texture'),
    };

    gl.uniform1f(locs.blueish, PARAMS.blueish);
    gl.uniform1f(locs.scale, PARAMS.scale);
    gl.uniform1f(locs.illumination, PARAMS.illumination);
    gl.uniform1f(locs.surfaceDistortion, PARAMS.surfaceDistortion);
    gl.uniform1f(locs.waterDistortion, PARAMS.waterDistortion);

    let imgRatio = 1;
    let imageReady = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(container.clientWidth * dpr));
      const height = Math.max(1, Math.round(container.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.uniform1f(locs.ratio, canvas.width / canvas.height);
    }

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(locs.texture, 0);

    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      imgRatio = image.naturalWidth / image.naturalHeight;
      gl.uniform1f(locs.imgRatio, imgRatio);
      imageReady = true;
      if (reduceMotion) drawFrame(0);
    };
    image.src = IMAGE_SRC;

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = null;
    let visible = true;

    function drawFrame(timeMs) {
      if (!imageReady) return;
      gl.uniform1f(locs.time, timeMs);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function loop(t) {
      drawFrame(t);
      raf = visible ? requestAnimationFrame(loop) : null;
    }

    if (!reduceMotion) {
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
