import { Box, Dialog, Flex, Input } from '@chakra-ui/react'
import { useRef } from 'react'
import { IoCloseSharp, IoSearchSharp } from 'react-icons/io5'
import { useNavigate, useSearchParams } from 'react-router'

// Gives the focus back to the header search button without scrolling there
// (the default focus restore made the page jump when closing)
function focusSearchButton() {
  document
    .querySelector<HTMLElement>('[data-search-trigger]')
    ?.focus({ preventScroll: true })
}

// Full-screen light search overlay with an underlined input, as on Frontity
export function SearchModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (!q) return
    onClose()
    navigate(`/search?s=${encodeURIComponent(q.toLowerCase())}`)
    window.scrollTo(0, 0)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => !d.open && onClose()}
      onExitComplete={focusSearchButton}
      restoreFocus={false}
      initialFocusEl={() => inputRef.current}
      size='full'
    >
      <Dialog.Backdrop bg='blackAlpha.600' />
      <Dialog.Positioner>
        <Dialog.Content
          width='100vw'
          height='100vh'
          maxWidth='100%'
          m='0'
          p='40px'
          bg='rgba(251,251,251,0.98)'
          boxShadow='none'
          borderRadius='0'
        >
          <Dialog.Body h='100%'>
            <Flex
              as='form'
              role='search'
              aria-label='Keresés'
              onSubmit={handleSubmit}
              position='relative'
              maxWidth='md'
              width='100%'
              height='80%'
              mx='auto'
              justifyContent='center'
              alignItems='center'
            >
              <Input
                ref={inputRef}
                name='s'
                defaultValue={params.get('s') ?? undefined}
                placeholder='Type and Hit Enter'
                variant='flushed'
                fontSize={{ base: '24px', md: '32px' }}
                height='auto'
                py={{ base: 1, md: 3 }}
                pr='2rem'
                borderColor='gray.200'
                css={{ '--focus-color': 'colors.primary.400' }}
              />
              <Box
                asChild
                position='absolute'
                right='0'
                color='gray.400'
                cursor='pointer'
              >
                <button type='submit' aria-label='Keresés indítása'>
                  <Box as={IoSearchSharp} boxSize='1.5rem' />
                </button>
              </Box>
            </Flex>
          </Dialog.Body>
          <Dialog.CloseTrigger
            position='absolute'
            top='8px'
            right='12px'
            w='40px'
            h='40px'
            display='flex'
            alignItems='center'
            justifyContent='center'
            borderRadius='full'
            color='gray.800'
            cursor='pointer'
            _hover={{ bg: 'blackAlpha.100' }}
            aria-label='Bezárás'
          >
            <Box as={IoCloseSharp} boxSize='20px' />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
