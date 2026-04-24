"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/earth_texture.jpg");

  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group>
      <Sphere ref={globeRef} args={[2, 64, 64]}>
        <meshPhongMaterial 
          map={texture} 
          color="#1e293b" // Base color for the planet
          shininess={10}
          specular={new THREE.Color("#333")}
        />
      </Sphere>
      <Sphere args={[2.05, 64, 64]}>
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.08} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}

export default function Globe3D() {
  return (
    <div className="w-full h-[600px] md:h-[800px] flex items-center justify-center bg-slate-950/20 rounded-3xl overflow-hidden border border-white/5">
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#f59e0b" />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <Globe />
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
