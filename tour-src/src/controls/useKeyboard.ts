import { useEffect } from 'react'
import { inputState } from './inputState'

const FORWARD = ['KeyW', 'ArrowUp']
const BACK = ['KeyS', 'ArrowDown']
const LEFT = ['KeyA', 'ArrowLeft']
const RIGHT = ['KeyD', 'ArrowRight']

export function useKeyboard() {
  useEffect(() => {
    const pressed = new Set<string>()

    const recompute = () => {
      const has = (codes: string[]) => codes.some((c) => pressed.has(c))
      inputState.moveZ = (has(FORWARD) ? 1 : 0) - (has(BACK) ? 1 : 0)
      inputState.moveX = (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0)
      inputState.sprint = pressed.has('ShiftLeft') || pressed.has('ShiftRight')
    }

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      pressed.add(e.code)
      if (e.code === 'KeyE') inputState.interactPressed = true
      recompute()
    }
    const onUp = (e: KeyboardEvent) => {
      pressed.delete(e.code)
      recompute()
    }
    const onBlur = () => {
      pressed.clear()
      recompute()
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
      onBlur()
    }
  }, [])
}
