import { Box, Flex } from '@chakra-ui/react'
import { useState } from 'react'
import type { IconType } from 'react-icons'
import { FaFacebookF, FaLink, FaRegEnvelope } from 'react-icons/fa'

const ICON_COLOR = '#D6AD7D'

// Decodes HTML entities in WordPress titles (&#8222; …) for the mail subject
function plainText(html: string) {
  const el = document.createElement('textarea')
  el.innerHTML = html
  return el.value
}

// Facebook share, copy link and e-mail buttons under posts and pages
export function ShareButtons({ uri, title }: { uri: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const url = () => `${window.location.origin}${uri}`

  const shareOnFacebook = () => {
    const share = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`
    window.open(share, 'fb-share', 'width=626,height=436')
  }
  const copyLink = async () => {
    await navigator.clipboard.writeText(url())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const sendMail = () => {
    const subject = encodeURIComponent(plainText(title))
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(url())}`
  }

  return (
    <Flex my='20px' alignItems='center' gap='10px'>
      <ShareButton
        icon={FaFacebookF}
        label='Megosztás Facebookon'
        onClick={shareOnFacebook}
      />
      <Box position='relative'>
        {copied && (
          <Box
            role='status'
            position='absolute'
            left='50%'
            top='-40px'
            transform='translateX(-50%)'
            width='max-content'
            px='8px'
            py='2px'
            borderRadius='2px'
            bg={ICON_COLOR}
            color='white'
            fontSize='14px'
            boxShadow='md'
            _after={{
              content: '""',
              position: 'absolute',
              left: '50%',
              bottom: '-6px',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${ICON_COLOR}`,
            }}
          >
            Link vágólapra másolva!
          </Box>
        )}
        <ShareButton icon={FaLink} label='Link másolása' onClick={copyLink} />
      </Box>
      <ShareButton
        icon={FaRegEnvelope}
        label='Küldés e-mailben'
        onClick={sendMail}
      />
    </Flex>
  )
}

function ShareButton({
  icon,
  label,
  onClick,
}: {
  icon: IconType
  label: string
  onClick: () => void
}) {
  return (
    <Box
      asChild
      display='flex'
      alignItems='center'
      justifyContent='center'
      w='40px'
      h='40px'
      p='10px'
      borderRadius='7px'
      bg='#F8F1E9'
      color={ICON_COLOR}
      cursor='pointer'
    >
      <button type='button' aria-label={label} title={label} onClick={onClick}>
        <Box as={icon} w='20px' h='20px' />
      </button>
    </Box>
  )
}
