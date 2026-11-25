import { cleanup } from '@testing-library/react'
import { MotionGlobalConfig } from 'motion/react'
import { afterEach } from 'vitest'

// Las pruebas verifican el estado final del DOM; las animaciones de Motion
// dejarían nodos en salida o valores intermedios de los contadores.
MotionGlobalConfig.skipAnimations = true

afterEach(() => {
  cleanup()
})
