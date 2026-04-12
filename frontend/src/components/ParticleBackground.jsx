import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ParticleBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    // Move camera back to view the full shape comfortably
    camera.position.z = 12;
    // Shift slightly down and right so the heart looks centered with text
    camera.position.y = -1;
    camera.position.x = -1.5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // --- PARTICLE SYSTEM LOGIC ---
    const particlesCount = 900; // Increased for better shape definition
    const geometry = new THREE.BufferGeometry();

    const initialPositions = new Float32Array(particlesCount * 3);
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const randoms = new Float32Array(particlesCount);
    const sizes = new Float32Array(particlesCount); // For size variation
    const speeds = new Float32Array(particlesCount); // For speed variation

    // Stratified sampling for even distribution along heart path
    const layers = 3; // Multiple layers for depth
    const particlesPerLayer = Math.floor(particlesCount / layers);
    
    for (let layer = 0; layer < layers; layer++) {
        const layerOffset = (layer - 1) * 0.8; // Z-axis offset for parallax
        const layerScale = 1.0 + layer * 0.15; // Slight scale variation per layer
        
        for (let i = 0; i < particlesPerLayer; i++) {
            const idx = layer * particlesPerLayer + i;
            
            // Even distribution along parametric path
            const t = (i / particlesPerLayer) * Math.PI * 2;
            
            // Parametric Heart Formula
            let x = 16 * Math.pow(Math.sin(t), 3);
            let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

            // Scale to fit background
            x *= 0.18 * layerScale;
            y *= 0.18 * layerScale;

            // Add subtle thickness - more controlled than before
            const thickness = 0.3 + Math.random() * 0.4;
            const angle = Math.random() * Math.PI * 2;
            x += Math.cos(angle) * thickness * 0.3;
            y += Math.sin(angle) * thickness * 0.3;
            const z = layerOffset + (Math.random() - 0.5) * 0.5;
            
            // Shift heart to right side to frame text better
            x += 3.5;

            initialPositions[idx * 3 + 0] = x;
            initialPositions[idx * 3 + 1] = y;
            initialPositions[idx * 3 + 2] = z;

            positions[idx * 3 + 0] = x;
            positions[idx * 3 + 1] = y;
            positions[idx * 3 + 2] = z;

            // Smooth Rainbow Gradient (Blue → Purple → Pink → Red → Orange → Yellow)
            // Continuous hue mapping along the heart path
            const normalizedT = t / (Math.PI * 2);
            // Map to hue range: 240° (blue) → 60° (yellow) going through the spectrum
            const hueAngle = 240 - (normalizedT * 180); // 240 → 60
            const hue = ((hueAngle % 360) + 360) % 360 / 360;
            
            const color = new THREE.Color();
            // Premium saturation and lightness
            color.setHSL(hue, 0.75, 0.55 + layer * 0.05); // Slight lightness variation per layer

            colors[idx * 3 + 0] = color.r;
            colors[idx * 3 + 1] = color.g;
            colors[idx * 3 + 2] = color.b;

            // Random attributes for varied motion
            randoms[idx] = Math.random();
            
            // Size variation based on layer and randomness
            sizes[idx] = 3.0 + Math.random() * 4.0 + layer * 1.5;
            
            // Speed variation for organic feel
            speeds[idx] = 0.5 + Math.random() * 1.0;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aInitialPosition', new THREE.BufferAttribute(initialPositions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    // --- SHADER LOGIC ---
    const vertexShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      
      attribute vec3 aInitialPosition;
      attribute vec3 aColor;
      attribute float aRandom;
      attribute float aSize;
      attribute float aSpeed;
      
      varying vec3 vColor;
      varying float vAlpha;

      // 3D Simplex Noise for organic breathing
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vColor = aColor;
        // Start from initial rigid shape
        vec3 pos = aInitialPosition;

        // 1. Organic Breathing (slow expansion/contraction)
        // Slower, smoother breathing cycle
        float breathe = sin(uTime * 0.3) * 0.15; // Gentle breathing amplitude
        pos *= 1.0 + breathe * aSpeed; // Speed affects breathing rate

        // 2. Noise-based organic motion (smoother, less jitter)
        float noiseX = snoise(vec3(pos.x * 0.4, pos.y * 0.4, uTime * 0.15));
        float noiseY = snoise(vec3(pos.x * 0.4, pos.y * 0.4, uTime * 0.15 + 100.0));
        float noiseZ = snoise(vec3(pos.z, uTime * 0.1, aRandom * 10.0));
        
        pos.x += noiseX * 0.2 * aSpeed;
        pos.y += noiseY * 0.2 * aSpeed;
        pos.z += noiseZ * 0.3;

        // 3. Cursor Interaction (smooth elastic response)
        vec3 targetMouse = vec3(uMouse.x * 14.0, uMouse.y * 10.0, 0.0);
        vec3 dir = pos - targetMouse;
        float dist = length(dir);
        
        float maxDist = 5.0; // Larger force field radius
        if(dist < maxDist) {
            float force = (maxDist - dist) / maxDist;
            force = smoothstep(0.0, 1.0, force); // Smooth easing
            dir = normalize(dir);
            
            // Elastic repulsion with smooth return
            pos += dir * force * 1.8 * aSpeed;
            
            // Subtle color brightening on interaction
            vColor = min(vColor + vec3(0.12) * force, 1.0);
        }

        // Distance-based alpha with depth variation
        float depthFade = smoothstep(25.0, 8.0, length(pos));
        vAlpha = depthFade * (0.5 + aRandom * 0.5) * (0.7 + aSpeed * 0.3);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Point size scaling with perspective depth and size attribute
        gl_PointSize = aSize * (25.0 / -mvPosition.z);
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        // Soft gradient circle rendering (GPU specific clipping)
        float dist = length(gl_PointCoord - vec2(0.5));
        if(dist > 0.5) discard;
        
        // Edge softening for premium organic feel. Max opacity lowered for white backgrounds
        float alpha = (0.5 - dist) * 2.0 * vAlpha * 0.65; 
        
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(-999, -999) }
      },
      transparent: true,
      depthWrite: false, 
      blending: THREE.NormalBlending // Reverted from AdditiveBlending for better rendering against light "#f8f9fb" background
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- INTERACTION & ANIMATION LOGIC ---
    let time = 0;
    
    const mouse = new THREE.Vector2(-999, -999);
    // Smooth lerp vector mapping 
    const smoothMouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('pointermove', onPointerMove);

    const handleResize = () => {
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      time += 0.015; // Animation speed
      material.uniforms.uTime.value = time;

      // Soft easing simulation for cursor track
      if (mouse.x !== -999) {
          smoothMouse.x += (mouse.x - smoothMouse.x) * 0.06;
          smoothMouse.y += (mouse.y - smoothMouse.y) * 0.06;
          material.uniforms.uMouse.value.copy(smoothMouse);
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      if(mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1, 
        pointerEvents: 'none',
        // Mask to keep center area cleaner for text readability
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, transparent 20%, black 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, transparent 20%, black 70%)',
      }}
    />
  );
};

export default ParticleBackground;
