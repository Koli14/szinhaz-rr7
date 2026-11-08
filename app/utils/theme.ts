import { createSystem, defaultConfig } from '@chakra-ui/react'

const colors = {
  primary: {
    50: { value: '#f2f2f2' },
    100: { value: '#d9d9d9' },
    200: { value: '#bfbfbf' },
    300: { value: '#a6a6a6' },
    400: { value: '#8c8c8c' },
    500: { value: '#737373' },
    600: { value: '#595959' },
    700: { value: '#404040' },
    800: { value: '#262626' },
    900: { value: '#0d0d0d' },
  },
  accent: {
    50: { value: '#fff3dc' },
    100: { value: '#ffddb1' },
    200: { value: '#fac882' },
    300: { value: '#f7b253' },
    400: { value: '#F4A91C' },
    500: { value: '#dc820a' },
    600: { value: '#ab6505' },
    700: { value: '#7b4802' },
    800: { value: '#4b2a00' },
    900: { value: '#1d0c00' },
  },
}

const fonts = {
  heading: { value: "'Noto Serif', serif" },
  body: { value: "'Open Sans', sans-serif" },
  menu: { value: "'Bellefair', serif" },
}

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: { colors, fonts },
  },
})
