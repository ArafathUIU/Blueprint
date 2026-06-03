"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NeuralNetworkProps {
  state?: "idle" | "streaming" | "complete" | "error";
}

const NODE_COUNT = 120;
const CONNECTIONS_PER_NODE = 4;

const haloGeometry = new THREE.SphereGeometry(0.14, 16, 16);
const nodeGeometry = new THREE.SphereGeometry(0.055, 12, 12);

const connectionMaterial = new THREE.LineBasicMaterial({
  color: "#ef4444",
  transparent: true,
  opacity: 0.25,
  depthWrite: false,
  linewidth: 1,
});

function NeuralNetworkInner({ state = "idle" }: NeuralNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const halosRef = useRef<THREE.Mesh[]>([]);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const pulseLinesRef = useRef<THREE.Line[]>([]);
  const nodeData = useRef<
    { position: THREE.Vector3; velocity: THREE.Vector3; connections: number[] }[]
  >([]);
  const pulseProgress = useRef<number[]>([]);

  // Build node grid + connections
  const { nodePositions, connections } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const data: typeof nodeData.current = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 7;
      const z = (Math.random() - 0.5) * 6;
      positions.push(new THREE.Vector3(x, y, z));
      data.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008
        ),
        connections: [],
      });
    }

    const conns: [number, number][] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const distances: { idx: number; dist: number }[] = [];
      for (let j = 0; j < NODE_COUNT; j++) {
        if (i === j) continue;
        distances.push({ idx: j, dist: positions[i].distanceTo(positions[j]) });
      }
      distances.sort((a, b) => a.dist - b.dist);
      const nearest = distances.slice(0, CONNECTIONS_PER_NODE + 3);
      const chosen = nearest.sort(() => Math.random() - 0.5).slice(0, CONNECTIONS_PER_NODE);

      for (const n of chosen) {
        if (!conns.some((c) => (c[0] === i && c[1] === n.idx) || (c[0] === n.idx && c[1] === i))) {
          conns.push([i, n.idx]);
          data[i].connections.push(n.idx);
          data[n.idx].connections.push(i);
        }
      }
    }

    nodeData.current = data;
    return { nodePositions: positions, connections: conns };
  }, []);

  // Connection lines
  const linesGeometry = useMemo(() => {
    const points: number[] = [];
    for (const [a, b] of connections) {
      points.push(
        nodePositions[a].x, nodePositions[a].y, nodePositions[a].z,
        nodePositions[b].x, nodePositions[b].y, nodePositions[b].z
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [nodePositions, connections]);

  // Pulse connections
  const pulseCount = Math.min(connections.length, 30);
  const pulseConnections = useMemo(
    () => connections.slice(0, pulseCount),
    [connections, pulseCount]
  );
  pulseProgress.current = pulseConnections.map(() => Math.random());

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const baseSpeed = state === "streaming" ? 0.3 : state === "complete" ? 0.1 : 0.07;
    const speed = baseSpeed * delta;

    groupRef.current.rotation.y += speed;
    groupRef.current.rotation.x += speed * 0.25;

    // Node positions
    nodeData.current.forEach((node, i) => {
      node.position.x += node.velocity.x * delta;
      node.position.y += node.velocity.y * delta;
      node.position.z += node.velocity.z * delta;

      if (Math.abs(node.position.x) > 5) node.velocity.x *= -1;
      if (Math.abs(node.position.y) > 3.5) node.velocity.y *= -1;
      if (Math.abs(node.position.z) > 3) node.velocity.z *= -1;

      if (nodesRef.current[i]) nodesRef.current[i].position.copy(node.position);
      if (halosRef.current[i]) halosRef.current[i].position.copy(node.position);
    });

    // Update base lines
    if (linesRef.current) {
      const positions: number[] = [];
      for (const [a, b] of connections) {
        positions.push(
          nodeData.current[a].position.x,
          nodeData.current[a].position.y,
          nodeData.current[a].position.z,
          nodeData.current[b].position.x,
          nodeData.current[b].position.y,
          nodeData.current[b].position.z
        );
      }
      const posAttr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.set(new Float32Array(positions));
      posAttr.needsUpdate = true;

      const op = state === "streaming" ? 0.35 : state === "complete" ? 0.25 : 0.18;
      (linesRef.current.material as THREE.LineBasicMaterial).opacity = op;
    }

    // Node glow
    const nodeOpacity = state === "streaming" ? 0.9 : 0.55;
    const haloOpacity = state === "streaming" ? 0.25 : 0.1;
    nodesRef.current.forEach((n) => {
      if (n) (n.material as THREE.MeshBasicMaterial).opacity = nodeOpacity;
    });
    halosRef.current.forEach((h) => {
      if (h) (h.material as THREE.MeshBasicMaterial).opacity = haloOpacity;
    });

    // Pulses
    const pulseSpeed = state === "streaming" ? 0.7 : 0.25;
    pulseLinesRef.current.forEach((pulse, i) => {
      pulseProgress.current[i] += delta * pulseSpeed;
      if (pulseProgress.current[i] > 1) pulseProgress.current[i] = 0;

      const [a, b] = pulseConnections[i];
      if (!a || !b) return;

      const t = pulseProgress.current[i];
      const pa = nodeData.current[a].position;
      const pb = nodeData.current[b].position;
      const mx = pa.x + (pb.x - pa.x) * t;
      const my = pa.y + (pb.y - pa.y) * t;
      const mz = pa.z + (pb.z - pa.z) * t;

      const st = Math.max(0, t - 0.05);
      const sx = pa.x + (pb.x - pa.x) * st;
      const sy = pa.y + (pb.y - pa.y) * st;
      const sz = pa.z + (pb.z - pa.z) * st;

      const pos = pulse.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, sx, sy, sz);
      pos.setXYZ(1, mx, my, mz);
      pos.needsUpdate = true;

      const pop = state === "streaming" ? 0.9 + Math.sin(t * 12) * 0.2 : 0.35;
      (pulse.material as THREE.LineBasicMaterial).opacity = pop;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Base connections */}
      <lineSegments
        ref={(el) => {
          linesRef.current = el;
        }}
        geometry={linesGeometry}
        material={connectionMaterial}
      />

      {/* Node halos (glow behind each node) */}
      {nodePositions.map((pos, i) => (
        <mesh
          key={`halo-${i}`}
          ref={(el) => { if (el) halosRef.current[i] = el; }}
          position={pos}
          geometry={haloGeometry}
        >
          <meshBasicMaterial color="#ef4444" transparent opacity={0.1} depthWrite={false} />
        </mesh>
      ))}

      {/* Nodes */}
      {nodePositions.map((pos, i) => (
        <mesh
          key={`node-${i}`}
          ref={(el) => { if (el) nodesRef.current[i] = el; }}
          position={pos}
          geometry={nodeGeometry}
        >
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}

      {/* Pulse lines */}
      {pulseConnections.map((_, i) => (
        <line
          key={`pulse-${i}`}
          ref={(el: any) => { pulseLinesRef.current[i] = el as THREE.Line; }}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false} />
        </line>
      ))}
    </group>
  );
}

export function NeuralNetwork({ state = "idle" }: NeuralNetworkProps) {
  return <NeuralNetworkInner state={state} />;
}
