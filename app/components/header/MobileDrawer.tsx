import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseTrigger,
} from '@chakra-ui/react'
import { Box, Flex } from '@chakra-ui/react'
import { Link } from '~/components/Link'
import { IoCloseSharp, IoLogoFacebook, IoLogoInstagram } from 'react-icons/io5'
import { socialLinks } from '~/utils/helpers'
import type { FlatMenuItem } from '~/types'

type HierarchicalItem = FlatMenuItem & { children?: HierarchicalItem[] }

function buildTree(items: FlatMenuItem[]): HierarchicalItem[] {
  const tree: HierarchicalItem[] = []
  const childrenOf: Record<string, HierarchicalItem[]> = {}
  items.forEach((item) => {
    const node: HierarchicalItem = { ...item }
    const { key: id, parentId } = node
    childrenOf[id] = childrenOf[id] ?? []
    node.children = childrenOf[id]
    if (parentId) {
      childrenOf[parentId] = childrenOf[parentId] ?? []
      childrenOf[parentId].push(node)
    } else {
      tree.push(node)
    }
  })
  return tree
}

const icons: Record<string, React.ElementType> = {
  facebook: IoLogoFacebook,
  instagram: IoLogoInstagram,
}

export function MobileDrawer({
  open,
  onClose,
  menuItems,
}: {
  open: boolean
  onClose: () => void
  menuItems: FlatMenuItem[]
}) {
  const tree = buildTree(menuItems)

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(d) => {
        if (!d.open) onClose()
      }}
      placement='start'
    >
      <DrawerBackdrop />
      <DrawerContent bg='white' maxW='280px'>
        <DrawerHeader
          borderBottomWidth='1px'
          borderColor='gray.100'
          py='4'
          px='5'
        >
          <Link to='/' onClick={onClose}>
            <img
              src='/images/szinhaz_logo.png'
              width='150'
              alt='Színház Online'
            />
          </Link>
        </DrawerHeader>
        <DrawerBody px='0' py='4'>
          <Box as='nav'>
            {tree.map((item) => (
              <DrawerMenuItem key={item.key} item={item} onClose={onClose} />
            ))}
          </Box>
          <Flex px='5' pt='6' gap='4'>
            {socialLinks.map(([name, link]) => {
              const Icon = icons[name]
              return (
                <a
                  key={name}
                  href={link}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={name}
                >
                  <Box as={Icon} boxSize='24px' color='accent.400' />
                </a>
              )
            })}
          </Flex>
        </DrawerBody>
        <DrawerCloseTrigger
          position='absolute'
          top='3'
          right='3'
          bg='transparent'
          border='none'
          cursor='pointer'
        >
          <Box as={IoCloseSharp} boxSize='24px' color='gray.600' />
        </DrawerCloseTrigger>
      </DrawerContent>
    </DrawerRoot>
  )
}

function DrawerMenuItem({
  item,
  onClose,
}: {
  item: HierarchicalItem
  onClose: () => void
}) {
  return (
    <>
      <Box
        asChild
        display='block'
        px='5'
        py='3'
        fontFamily='menu'
        fontSize='18px'
        textTransform='uppercase'
        letterSpacing='1px'
        color='gray.800'
        borderBottomWidth='1px'
        borderColor='gray.100'
        _hover={{ color: 'accent.400', bg: 'gray.50' }}
      >
        <Link to={item.uri} onClick={onClose}>
          {item.title}
        </Link>
      </Box>
      {item.children?.map((child) => (
        <Box
          key={child.key}
          asChild
          display='block'
          px='8'
          py='2'
          fontSize='15px'
          fontFamily='menu'
          textTransform='uppercase'
          letterSpacing='1px'
          color='gray.600'
          borderBottomWidth='1px'
          borderColor='gray.50'
          _hover={{ color: 'accent.400', bg: 'gray.50' }}
        >
          <Link to={child.uri} onClick={onClose}>
            {child.title}
          </Link>
        </Box>
      ))}
    </>
  )
}
