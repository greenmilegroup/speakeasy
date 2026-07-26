import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * The lighting rig stays deliberately tiny: a hemisphere fill, a neutral
 * PMREM environment for speculars (bottles, tin, glassware), and only three
 * real point lights. The venue's mood comes from emissive surfaces (LED
 * strips, sign, candles) which the bloom pass picks up.
 */
export function Lighting() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.22
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return (
    <>
      <hemisphereLight args={['#42352b', '#15100d', 0.4]} />
      {/* bar */}
      <pointLight position={[-3.2, 2.6, 3]} intensity={22} color="#ffb46b" distance={9} decay={2} />
      {/* dining center */}
      <pointLight position={[0, 2.7, 0.5]} intensity={18} color="#ffab5e" distance={10} decay={2} />
      {/* stage red wash */}
      <pointLight position={[0, 2.5, -8]} intensity={26} color="#ff3428" distance={8} decay={2} />
    </>
  )
}
