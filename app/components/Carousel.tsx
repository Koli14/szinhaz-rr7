import { Box, Flex } from '@chakra-ui/react'
import { Children, useImperativeHandle, useRef } from 'react'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'

export type CarouselApi = { goTo: (index: number) => void }

type Props = {
  label: string
  // Lets the parent jump to a slide (e.g. from a thumbnail strip)
  apiRef?: React.Ref<CarouselApi>
  children: React.ReactNode
  // Slides visible at once from the `md` breakpoint (always 1 on mobile)
  perView?: number
  arrowColor?: string | Record<string, string>
}

// Scroll-snap carousel: swipeable on touch devices, arrow buttons wrap around
// at both ends like the Frontity one did.
export function Carousel({
  label,
  children,
  perView = 1,
  arrowColor = 'white',
  apiRef,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useImperativeHandle(apiRef, () => ({
    goTo: (index) => {
      const slide = ref.current?.children[index] as HTMLElement | undefined
      if (slide) ref.current!.scrollTo({ left: slide.offsetLeft })
    },
  }))

  const slide = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth
    const max = el.scrollWidth - el.clientWidth
    if (dir === 1 && el.scrollLeft >= max - 2) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (dir === -1 && el.scrollLeft <= 2) {
      el.scrollTo({ left: max, behavior: 'smooth' })
    } else {
      el.scrollBy({ left: dir * (step || el.clientWidth), behavior: 'smooth' })
    }
  }

  const arrow = (dir: 1 | -1) => (
    <Box
      as='button'
      aria-label={dir === 1 ? 'Következő' : 'Előző'}
      onClick={() => slide(dir)}
      position='absolute'
      top='0'
      bottom='0'
      {...(dir === 1 ? { right: '8px' } : { left: '8px' })}
      px='0'
      cursor='pointer'
      color={arrowColor}
      zIndex='1'
    >
      <Box as={dir === 1 ? BsChevronRight : BsChevronLeft} height='30px' />
    </Box>
  )

  return (
    <Box position='relative' role='region' aria-label={label}>
      <Flex
        ref={ref}
        position='relative'
        overflowX='auto'
        scrollSnapType='x mandatory'
        css={{
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {Children.map(children, (child) => (
          <Box
            flex={{ base: '0 0 100%', md: `0 0 ${100 / perView}%` }}
            scrollSnapAlign='start'
            display='flex'
            justifyContent='center'
          >
            {child}
          </Box>
        ))}
      </Flex>
      {arrow(-1)}
      {arrow(1)}
    </Box>
  )
}
