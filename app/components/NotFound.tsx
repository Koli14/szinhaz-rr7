import { Box, Heading, Text } from '@chakra-ui/react'
import { isRouteErrorResponse, useRouteError } from 'react-router'

export const NOT_FOUND_TITLE = 'Az oldal nem található - Színház.online'

// The 404 page, shown inside the site's header and footer
export function NotFound() {
  return (
    <Box maxWidth='800px' mx='auto' p='24px' textAlign='center'>
      <Heading
        as='h1'
        mt='24px'
        mb='8px'
        color='rgb(12, 17, 43)'
        fontSize='4em'
        lineHeight='1.2'
      >
        404
      </Heading>
      <Text my='24px' lineHeight='1.6em' color='rgba(12, 17, 43, 0.8)'>
        Az oldalt nem találtuk.
      </Text>
    </Box>
  )
}

// Route ErrorBoundary: the 404 page, or a short notice for other errors
export function PageError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />
  return (
    <Box maxWidth='800px' mx='auto' p='24px' textAlign='center'>
      <Text my='24px'>Nem sikerült betölteni az oldalt.</Text>
    </Box>
  )
}
