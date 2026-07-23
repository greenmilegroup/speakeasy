/**
 * Per-frame input written by the keyboard hook, drag-look fallback and the
 * mobile touch layer, and consumed once per frame by PlayerControls. Kept as
 * a module singleton (never React state) so input never triggers re-renders.
 */
export const inputState = {
  /** strafe: -1 left … +1 right */
  moveX: 0,
  /** walk: -1 back … +1 forward */
  moveZ: 0,
  sprint: false,
  /** accumulated look deltas (px) since last frame — drag & touch modes */
  lookDX: 0,
  lookDY: 0,
  /** edge-triggered "E" interact, consumed by the hotspot system */
  interactPressed: false,
}

export function consumeLook(): { dx: number; dy: number } {
  const dx = inputState.lookDX
  const dy = inputState.lookDY
  inputState.lookDX = 0
  inputState.lookDY = 0
  return { dx, dy }
}

export function consumeInteract(): boolean {
  const was = inputState.interactPressed
  inputState.interactPressed = false
  return was
}
