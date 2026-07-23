export {}

declare global {
  interface VenueDebugApi {
    info?: () => { calls: number; triangles: number; geometries: number; textures: number }
    setLayout?: (id: string) => void
    teleport?: (x: number, z: number, yaw?: number) => void
    getPosition?: () => { x: number; y: number; z: number; yaw: number }
    simulate?: (
      seconds: number,
      input: { forward?: number; strafe?: number; sprint?: boolean },
    ) => { x: number; y: number; z: number; yaw: number }
  }

  interface Window {
    __venue?: VenueDebugApi
  }
}
