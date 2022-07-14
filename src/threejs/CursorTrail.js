import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const CursorTrail = () => {
  let mouse = new THREE.Vector3(0, 0, 1);
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Mouse Movement

  const [positions, colors, scales, parameters] = useMemo(() => {
    const parameters = {};
    parameters.count = 300;
    parameters.size = 0.01;
    parameters.radius = 5;
    parameters.insideColor = "#ff6030";
    parameters.outsideColor = "#1b3984";
    const positions = new Float32Array(parameters.count * 3);
    const colors = new Float32Array(parameters.count * 3);
    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);
    const scales = new Float32Array(parameters.count * 1);
    for (let i = 0; i < parameters.count * 3; i++) {
      const i3 = i * 3;
      //Position
      const radius = Math.random() * parameters.radius;

      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      //Color
      const mixedColor = colorInside.clone();
      mixedColor.lerp(colorOutside, radius / parameters.radius);
      colors[i3 + 0] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      //Scales
      scales[i] = Math.random();
    }
    return [positions, colors, scales, parameters];
  }, []);

  //FragmentShader
  const fragmentShader = `
    varying vec3 vColor;
  
    void main(){
       float strength = distance(gl_PointCoord,vec2(0.5));
       strength =  step(0.25,strength);
       strength = pow(strength,10.0);
  
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        vec3 color = mix(vec3(0.0),vColor,strength);
  
        gl_FragColor = vec4(color, step(ll, 0.5));
       
          }`;
  // vertxShader
  const vertexShader = `
    uniform float uSize;
    uniform float uTime;
    
    
    
    attribute float aScale;
    
    
    varying vec3 vColor;
    
    
     void main(){
                vec4 modelPosition = modelMatrix * vec4(position,1.0);
      
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
                gl_Position = projectionPosition;
    
    
                gl_PointSize = uSize * aScale;
                gl_PointSize *= ( 1.0 / - viewPosition.z );
    
                vColor = color;
    
    
            }
  `;
  const shaderMaterial = useRef();
  const positionBufferRef = useRef();
  const renderer = useThree((state) => state.gl);

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
  //Handling Mouse
  const { camera } = useThree();
  function handleMouseMove(event) {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    mouse.z = 1;

    // convert screen coordinates to threejs world position
    // https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z

    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    var pos = camera.position.clone().add(dir.multiplyScalar(distance));

    mouse = pos;
  }
  window.addEventListener("mousemove", handleMouseMove);

  //Animating Mouse Position
  const currentPointVectorHolder = new THREE.Vector3(0, 0, 0);
  const previousPointVectorHolder = new THREE.Vector3(0, 0, 0);

  useFrame((state) => {
    positionBufferRef.current.needsUpdate = true;
    const positionsArray = positionBufferRef.current.array;

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;
      const previous = (i - 1) * 3;
      if (i3 === 0) {
        positionsArray[0] = mouse.x;
        positionsArray[1] = mouse.y + 0.05;
        positionsArray[2] = 1;
      } else {
        const currentPoint = currentPointVectorHolder.set(
          positionsArray[i3],
          positionsArray[i3 + 1],
          positionsArray[i3 + 2]
        );
        const previousPoint = previousPointVectorHolder.set(
          positionsArray[previous],
          positionsArray[previous + 1],
          positionsArray[previous + 2]
        );
        const lerpPoint = currentPoint.lerp(previousPoint, 0.9);
        positionsArray[i3] = lerpPoint.x;
        positionsArray[i3 + 1] = lerpPoint.y;
        positionsArray[i3 + 2] = 1;
      }
    }
  });

  return (
    <points>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          ref={positionBufferRef}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
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

export default CursorTrail;
