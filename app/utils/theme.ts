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
  // Chakra v1's gray scale (cool blue-gray), as on the Frontity site. v3's
  // is a neutral zinc, which made texts and excerpts warmer and darker.
  gray: {
    50: { value: '#F7FAFC' },
    100: { value: '#EDF2F7' },
    200: { value: '#E2E8F0' },
    300: { value: '#CBD5E0' },
    400: { value: '#A0AEC0' },
    500: { value: '#718096' },
    600: { value: '#4A5568' },
    700: { value: '#2D3748' },
    800: { value: '#1A202C' },
    900: { value: '#171923' },
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

// Chakra v1's breakpoints. v3 moved lg from 62em (992px) to 1024px, so
// windows of 992–1023px got the phone header and single-column pages.
const breakpoints = {
  sm: '30em',
  md: '48em',
  lg: '62em',
  xl: '80em',
  '2xl': '96em',
}

export const system = createSystem(defaultConfig, {
  // Chakra v1 set the text color on the body (gray.800); v3 uses near-black
  globalCss: {
    body: { color: 'gray.800' },
  },
  theme: {
    breakpoints,
    tokens: { colors, fonts },
  },
})
