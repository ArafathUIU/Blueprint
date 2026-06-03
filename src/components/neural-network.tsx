"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NeuralNetworkProps {
  state?: "idle" | "streaming" | "complete" | "error";
}

const NODE_COUNT = 80;
const CONNECTIONS_PER_NODE = 3;
const connectionMaterial = new THREE.LineBasicMaterial({
  color: "#DC2626",
  transparent: true,
  opacity: 0.15,
  depthWrite: false,
});

function NeuralNetworkInner({ state = "idle" }: NeuralNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const linesRef = useRef<THREE.LineSegments[]>([]);
  const pulseLinesRef = useRef<THREE.Line[]>([]);
  const nodeData = useRef<
    { position: THREE.Vector3; velocity: THREE.Vector3; connections: number[] }[]
  >([]);
  const pulseProgress = useRef<number[]>([]);

  const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.03, 8, 8), []);

  // Build nodes in a 3D grid
  const { nodePositions, connections } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const data: typeof nodeData.current = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 6;
      const z = (Math.random() - 0.5) * 5;
      positions.push(new THREE.Vector3(x, y, z));
      data.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        connections: [],
      });
    }

    // Build connections (k-nearest neighbors)
    const conns: [number, number][] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const distances: { idx: number; dist: number }[] = [];
      for (let j = 0; j < NODE_COUNT; j++) {
        if (i === j) continue;
        distances.push({
          idx: j,
          dist: positions[i].distanceTo(positions[j]),
        });
      }
      distances.sort((a, b) => a.dist - b.dist);
      const nearest = distances.slice(0, CONNECTIONS_PER_NODE + 2);
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

  // Connection lines geometry
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

  // Pulse lines (subset of connections that animate)
  const pulseCount = Math.min(connections.length, 20);
  const pulseConnections = useMemo(
    () => connections.slice(0, pulseCount),
    [connections, pulseCount]
  );
  pulseProgress.current = pulseConnections.map(
    () => Math.random()
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const baseSpeed = state === "streaming" ? 0.4 : state === "complete" ? 0.15 : 0.1;
    const speed = baseSpeed * delta;

    // Rotate entire scene slowly
    groupRef.current.rotation.y += speed;
    groupRef.current.rotation.x += speed * 0.3;

    // Animate node positions subtly
    nodeData.current.forEach((node, i) => {
      node.position.x += node.velocity.x * delta;
      node.position.y += node.velocity.y * delta;
      node.position.z += node.velocity.z * delta;

      if (Math.abs(node.position.x) > 4) node.velocity.x *= -1;
      if (Math.abs(node.position.y) > 3) node.velocity.y *= -1;
      if (Math.abs(node.position.z) > 2.5) node.velocity.z *= -1;

      if (nodesRef.current[i]) {
        nodesRef.current[i].position.copy(node.position);
      }
    });

    // Update base connection lines — rebuild geometry
    if (linesRef.current[0]) {
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
      const posAttr = linesRef.current[0].geometry.attributes.position as THREE.BufferAttribute;
      posAttr.set(new Float32Array(positions));
      posAttr.needsUpdate = true;

      (linesRef.current[0].material as THREE.LineBasicMaterial).opacity =
        state === "streaming" ? 0.2 : 0.1;
    }

    // Animate pulses
    const pulseSpeed = state === "streaming" ? 0.6 : 0.25;
    pulseLinesRef.current.forEach((pulse, i) => {
      pulseProgress.current[i] += delta * pulseSpeed;
      if (pulseProgress.current[i] > 1) pulseProgress.current[i] = 0;

      const [a, b] = pulseConnections[i];
      if (!a || !b) return;

      const t = pulseProgress.current[i];
      const posA = nodeData.current[a].position;
      const posB = nodeData.current[b].position;
      const midX = posA.x + (posB.x - posA.x) * t;
      const midY = posA.y + (posB.y - posA.y) * t;
      const midZ = posA.z + (posB.z - posA.z) * t;

      const pos = pulse.geometry.attributes.position as THREE.BufferAttribute;
      const startT = Math.max(0, t - 0.08);
      const startX = posA.x + (posB.x - posA.x) * startT;
      const startY = posA.y + (posB.y - posA.y) * startT;
      const startZ = posA.z + (posB.z - posA.z) * startT;

      pos.setXYZ(0, startX, startY, startZ);
      pos.setXYZ(1, midX, midY, midZ);
      pos.needsUpdate = true;

      (pulse.material as THREE.LineBasicMaterial).opacity =
        state === "streaming" ? 0.7 + Math.sin(t * 10) * 0.3 : 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Base connection lines — single lineSegments for all */}
      <lineSegments
        ref={(el) => {
          linesRef.current[0] = el!;
        }}
        geometry={linesGeometry}
        material={connectionMaterial}
      />

      {/* Nodes */}
      {nodePositions.map((pos, i) => (
        <mesh
          key={`node-${i}`}
          ref={(el) => {
            if (el) nodesRef.current[i] = el;
          }}
          position={pos}
          geometry={nodeGeometry}
        >
          <meshBasicMaterial
            color="#DC2626"
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
      ))}

      {pulseConnections.map((_, i) => (
        <line
          key={`pulse-${i}`}
          ref={(el: any) => {
            pulseLinesRef.current[i] = el as THREE.Line;
          }}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
}

export function NeuralNetwork({ state = "idle" }: NeuralNetworkProps) {
  return <NeuralNetworkInner state={state} />;
}
