import React, { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { proxy, useSnapshot } from 'valtio'
import { HexColorPicker } from 'react-colorful'
import { useGLTF, MeshWobbleMaterial, OrbitControls } from '@react-three/drei'
import { LineBasicMaterial, MeshStandardMaterial } from 'three'
import { useSpring, a } from 'react-spring/three'
import { RecoilRoot, useRecoilState, useRecoilValue, atom } from 'recoil'
import * as THREE from 'three'

const SHOOT_RANGE = 100
const SPHERE_VELOCITY = 0.03

const state = proxy({
  current: null,
  items: {
    golden: '#FFD700'
  },
  wobbleSpeed: 0
})

function Bunny(props) {
  const group = useRef()
  const snap = useSnapshot(state)
  const { nodes, materials } = useGLTF('bunny.glb')
  const [hovered, setHovered] = useState(null)
  const [active, setActive] = useState(false)
  const properties = useSpring({
    color: hovered ? 'hotpink' : 'blue',
    wobbleSpeed: active ? 1.5 : 0.5
  })

  useFrame(() => {
    // group.current.rotation.y += 0.001
    // state.wobbleSpeed += 0.0001
  })

  return (
    <group
      ref={group}
      {...props}
      dispose={null}
      onPointOver={(e) => {}}
      onPointerOut={(e) => {}}
      onPointerDown={(e) => {
        state.wobbleSpeed += 0.01
        console.log('click' + state.wobbleSpeed, 'active: ' + active)
        setActive(!active)
      }}
      onPointerMissed={(e) => {}}>
      <group position={[0, 0, -2.99]}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <group position={[0, 0.08, 1.57]}>
            <a.mesh geometry={nodes.Jeff_Koons_Balloon_Rabbit.geometry}>
              <MeshWobbleMaterial
                attach="material"
                speed={state.wobbleSpeed}
                factor={0.6}
                roughness={0.5}
                metalness={1.0}
                color={'#FFD700'}
              />
            </a.mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
function Picker() {
  const snap = useSnapshot(state)
  return (
    <div style={{ display: snap.current ? 'block' : 'none' }}>
      <HexColorPicker className="picker" color={snap.items[snap.current]} onChange={(color) => (state.items[snap.current] = color)} />
      <h1>{snap.items[snap.current]}</h1>
    </div>
  )
}

const spherePositionState = atom({
  key: 'spherePositions', // unique ID (with respect to other atoms/selectors)
  default: [] // default value (aka initial value)
})

///shoot sphere

function ShootSphere() {
  const [spheres, setSpheres] = useRecoilState(spherePositionState)
  const { viewport } = useThree()
  const ref = useRef()

  useFrame(({ mouse }) => {
    const x = (mouse.x * viewport.width) / 2
    const y = (mouse.y * viewport.height) / 2
    ref.current.position.set(x, y, 0)
  })

  return (
    <mesh
      ref={ref}
      // position={[0, 0, -100]}
      onClick={() =>
        setSpheres(
          [
            ...spheres,
            {
              id: Math.random(), // This needs to be unique.. Random isn't perfect but it works. Could use a uuid here.
              x: -ref.current.position.x,
              y: -ref.current.position.y,
              z: 3,
              velocity: [0, 0]
            }
          ],
          console.log('laser fired')
          //  console.log('refx : ' + ref.current.position.x),
          //  console.log('refy : ' + ref.current.position.y)
        )
      }>
      <planeBufferGeometry attach="geometry" args={[100, 100]} />
      <meshStandardMaterial attach="material" color="orange" emissive="#ff0860" visible={false} />
    </mesh>
  )
}

function SphereController() {
  const spheres = useRecoilValue(spherePositionState)
  return (
    <group>
      {spheres.map((sphere) => (
        <mesh position={[-sphere.x, -sphere.y, sphere.z]} key={`${sphere.id}`} castShadow>
          <sphereBufferGeometry attach="geometry" />
          <meshNormalMaterial attach="material" wireframe />
        </mesh>
      ))}
    </group>
  )
}
///

function MoveSphere() {
  // viewport = canvas in 3d units (meters)
  const [spheres, setSpherePositions] = useRecoilState(spherePositionState)

  useFrame(({ mouse }) => {
    setSpherePositions(
      spheres
        .map((sphere) => ({
          id: sphere.id,
          x: sphere.x,
          y: sphere.y,
          z: sphere.z - SPHERE_VELOCITY,
          velocity: sphere.velocity
        }))
        .filter((sphere) => sphere.z > -SHOOT_RANGE)
    )
  })
  return null
}
const Plane = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
    <meshPhysicalMaterial attach="material" color="white" />
  </mesh>
)
export default function App() {
  return (
    <>
      <h1>Golden!</h1>
      <Canvas
        style={{ background: 'pink' }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}>
        <ambientLight intensity={0.5} />
        <spotLight intensity={0.5} position={[0, 10, 0]} castShadow />
        <pointLight intensity={0.3} position={[0, 10, 10]} />
        <pointLight intensity={0.3} position={[0, -10, -10]} />
        <OrbitControls />
        <Suspense fallback={null}>
          <Bunny />
        </Suspense>
        <RecoilRoot>
          <ShootSphere />
          <SphereController />
          <MoveSphere />
        </RecoilRoot>
        <Plane />
      </Canvas>
    </>
  )
}
