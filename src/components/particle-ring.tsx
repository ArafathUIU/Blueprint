"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

type RingState = "idle" | "streaming" | "complete" | "error";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uFrequency;
  attribute float aAngle;
  attribute float aRadiusOffset;
  attribute float aPhase;
  varying float vAlpha;
  varying float vDistance;

  float noise3D(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
  }

  void main() {
    float angle = aAngle + uTime * 0.3;
    float radius = 2.0 + aRadiusOffset;

    // Multi-frequency wave displacement along the ring
    float wave1 = sin(angle * uFrequency + aPhase + uTime * 1.5) * uAmplitude * 0.8;
    float wave2 = cos(angle * (uFrequency * 2.3) - uTime * 0.9 + aPhase) * uAmplitude * 0.4;
    float noise = noise3D(vec3(angle * 4.0, aPhase, uTime * 0.5)) * uAmplitude * 0.3;

    float displacement = wave1 + wave2 + noise;

    // Base position on torus
    float x = cos(angle) * (radius + displacement);
    float y = sin(angle * 3.0 + uTime * 0.5) * 0.6 + displacement * 0.5;
    float z = sin(angle) * (radius + displacement) * 0.6;

    vec4 modelPosition = modelMatrix * vec4(x, y, z, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    // Size based on distance and amplitude
    gl_PointSize = (40.0 / -viewPosition.z) * (1.0 + uAmplitude * 0.5);
    vAlpha = smoothstep(-1.0, 1.0, displacement) * 0.8 + 0.2;
    vDistance = -viewPosition.z;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uGlow;
  varying float vAlpha;
  varying float vDistance;

  void main() {
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = smoothstep(1.0, 0.0, dist);

    // Inner white core, outer red glow
    vec3 coreColor = vec3(1.0, 1.0, 1.0);
    vec3 glowColor = vec3(0.863, 0.149, 0.149); // #DC2626

    float colorMix = smoothstep(0.15, 0.6, dist);
    vec3 color = mix(coreColor, glowColor, colorMix);

    float glowAlpha = alpha * vAlpha * (0.6 + uGlow * 0.4);
    gl_FragColor = vec4(color, glowAlpha);
  }
`;

interface RingLayerProps {
  count: number;
  radiusBase: number;
  amplitude?: number;
  frequency?: number;
}

function RingLayer({ count, radiusBase, amplitude = 1, frequency = 8 }: RingLayerProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, angles, radiusOffsets, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ang = new Float32Array(count);
    const rad = new Float32Array(count);
    const phs = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = (Math.random() - 0.5) * 0.3;
      ang[i] = a;
      rad[i] = r;
      phs[i] = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * (radiusBase + r);
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(a) * (radiusBase + r);
    }
    return { positions: pos, angles: ang, radiusOffsets: rad, phases: phs };
  }, [count, radiusBase]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    geo.setAttribute("aRadiusOffset", new THREE.BufferAttribute(radiusOffsets, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [positions, angles, radiusOffsets, phases]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: amplitude },
      uFrequency: { value: frequency },
      uGlow: { value: 1.0 },
    }),
    [amplitude, frequency]
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface ParticleRingProps {
  state?: RingState;
}

export function ParticleRing({ state = "idle" }: ParticleRingProps) {
  const bloomRef = useRef<any>(null);
  const targetGlow = useRef(0.5);
  const currentGlow = useRef(0.5);

  useFrame((_, delta) => {
    const target = state === "streaming" ? 1.6 : state === "complete" ? 2.0 : state === "error" ? 0.2 : 0.5;
    targetGlow.current += (target - targetGlow.current) * delta * 3;
    currentGlow.current = targetGlow.current;

    if (bloomRef.current) {
      bloomRef.current.intensity = currentGlow.current;
    }
  });

  const sceneRotationSpeed = state === "streaming" ? 0.15 : state === "complete" ? 0.05 : 0.08;

  return (
    <>
      <EffectComposer>
        <Bloom
          ref={bloomRef}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.5}
          radius={0.5}
        />
      </EffectComposer>

      <group rotation={[0.4, 0, 0]}>
        <RingLayer count={8000} radiusBase={1.6} amplitude={0.6} frequency={7} />
        <RingLayer count={12000} radiusBase={2.0} amplitude={0.45} frequency={9} />
        <RingLayer count={8000} radiusBase={2.4} amplitude={0.3} frequency={11} />
      </group>
    </>
  );
}
