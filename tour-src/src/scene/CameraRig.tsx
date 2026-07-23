import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { EYE_HEIGHT, ROOM } from '../data/floorplan'
import { URL_PARAMS } from '../debug/urlParams'

export interface CamPose {
  position: readonly [number, number, number]
  lookAt: readonly [number, number, number]
}

/** Named deterministic poses used by the screenshot harness. */
export const CAM_POSES: Record<string, CamPose> = {
  spawn: { position: [0, 1.6, 8.6], lookAt: [0, 1.35, -8.6] },
  bar: { position: [-1.1, 1.6, 4.8], lookAt: [-4.3, 1.25, 1.6] },
  stage: { position: [0, 1.6, -4.4], lookAt: [0, 1.4, -9.5] },
  dining: { position: [-2.7, 1.7, -1.4], lookAt: [2.8, 0.95, -5.2] },
  banquette: { position: [0.6, 1.6, 2.2], lookAt: [4.4, 1.15, -1.4] },
  overview: { position: [-3.4, 2.5, 9.0], lookAt: [1.8, 0.4, -5.5] },
}

/**
 * Sets the initial camera: either a named screenshot pose (?cam=...) or the
 * venue spawn point at the entrance. Player controls take over afterwards
 * unless a fixed cam is active.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    const pose = URL_PARAMS.cam ? CAM_POSES[URL_PARAMS.cam] : undefined
    if (pose) {
      camera.position.set(...pose.position)
      camera.lookAt(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2])
    } else {
      const [x, z] = ROOM.spawn.position
      camera.position.set(x, EYE_HEIGHT, z)
      camera.rotation.set(0, ROOM.spawn.yaw, 0, 'YXZ')
    }
  }, [camera])
  return null
}
