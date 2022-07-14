import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import CursorTrail from "./threejs/CursorTrail";
import Galaxy from "./threejs/Galaxy";

import "./App.css";

const PerpectCamera = () => {
  const myCamera = useRef();

  const { camera } = useThree();

  useEffect(() => {
    camera.rotateX(50);
  }, [camera]);

  return (
    <PerspectiveCamera
      ref={myCamera}
      makeDefault
      position={[0, 1.7, 5]}
      fov={45}
    />
  );
};

export default function App() {
  return (
    <Canvas className="mainCanvas">
      <PerpectCamera />
      <Galaxy />
      <CursorTrail />
    </Canvas>
  );
}
