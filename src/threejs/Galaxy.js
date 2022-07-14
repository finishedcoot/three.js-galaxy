import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const Galaxy = () => {
  const [positions, colors, randomness, scales] = useMemo(() => {
    const parameters = {};
    parameters.count = 50000;
    parameters.size = 0.01;
    parameters.radius = 5;
    parameters.branches = 3;
    parameters.spin = 1;
    parameters.randomness = 0.2;
    parameters.randomnessPower = 3;
    parameters.insideColor = "#ff6030";
    parameters.outsideColor = "#1b3984";
    const positions = new Float32Array(parameters.count * 3);
    const colors = new Float32Array(parameters.count * 3);
    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);
    const randomness = new Float32Array(parameters.count * 3);
    const scales = new Float32Array(parameters.count * 1);
    for (let i = 0; i < parameters.count * 3; i++) {
      const i3 = i * 3;
      //Position
      const radius = Math.random() * parameters.radius;
      const branchAngle =
        ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

      const randomX =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius;
      const randomY =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius;
      const randomZ =
        Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius +
        1;

      positions[i3] = Math.cos(branchAngle) * radius;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle) * radius;
      //Randomness
      randomness[i3] = randomX;
      randomness[i3 + 1] = randomY;
      randomness[i3 + 2] = randomZ;
      //Color
      const mixedColor = colorInside.clone();
      mixedColor.lerp(colorOutside, radius / parameters.radius);
      colors[i3 + 0] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      //Scales
      scales[i] = Math.random();
    }
    return [positions, colors, randomness, scales];
  }, []);

  //FragmentShader
  const fragmentShader = `
    varying vec3 vColor;
  
    void main(){
    //Disc
        // float strength = distance(gl_PointCoord,vec2(0.5));
        // strength = step(0.5,strength);
        // strength = 1.0 - strength;
      
    // Difuse point
  //   float strength = distance(gl_PointCoord,vec2(0.5));
  //   strength *= 2.0;
  //   strength = 1.0 - strength;     
  
      //Light point
      float strength = distance(gl_PointCoord,vec2(0.5));
      strength = 1.0 - strength;
      strength = pow(strength,10.0);
  
      //final color 
      vec3 color = mix(vec3(0.0),vColor,strength);
  
              gl_FragColor = vec4(color,1.0);
          }`;
  // vertxShader
  const vertexShader = `
  uniform float uSize;
  uniform float uTime;
  
  
  attribute float aScale;
  attribute vec3 aRandomness;
  
  
  varying vec3 vColor;
  
   void main(){
              vec4 modelPosition = modelMatrix * vec4(position,1.0);
  
              //Spin
              float angle = atan(modelPosition.x,modelPosition.z);
              float distanceToCenter = length(modelPosition.xz);
              float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
              angle += angleOffset;
              modelPosition.x = cos(angle)* distanceToCenter;
              modelPosition.z = sin(angle)* distanceToCenter;
  
  
              // Randomness
              modelPosition.xyz += aRandomness;
  
  
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectionPosition = projectionMatrix * viewPosition;
              gl_Position = projectionPosition;
  
  
              gl_PointSize = uSize * aScale;
              gl_PointSize *= ( 1.0 / - viewPosition.z );
  
              vColor = color;
  
  
          }
  `;
  const shaderMaterial = useRef();
  const renderer = useThree((state) => state.gl);
  const clock = useThree((state) => state.clock);
  useFrame(() => {
    shaderMaterial.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  const shaderData = useMemo(
    () => ({
      uniforms: {
        uSize: { value: 30 * renderer.getPixelRatio() },
        uTime: { value: 0 },
      },
      fragmentShader,
      vertexShader,
    }),
    []
  );

  return (
    <points>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandomness"
          count={randomness.length / 3}
          array={randomness}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={positions.length / 3}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderMaterial}
        attach="material"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={true}
        {...shaderData}
      />
    </points>
  );
};

export default Galaxy;
