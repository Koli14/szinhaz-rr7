import { Box, Drawer, Flex } from '@chakra-ui/react'
import { useState } from 'react'
import {
  IoChevronDownSharp,
  IoChevronUpSharp,
  IoCloseSharp,
} from 'react-icons/io5'
import { Link } from '~/components/Link'
import SearchButton from './SearchButton'
import SocialNav from './SocialNav'
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

// Left drawer with the main menu, as on Frontity: expandable submenus,
// social links and the search button at the bottom.
export function MobileDrawer({
  open,
  onClose,
  onSearchOpen,
  menuItems,
}: {
  open: boolean
  onClose: () => void
  onSearchOpen: () => void
  menuItems: FlatMenuItem[]
}) {
  const tree = buildTree(menuItems)

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(d) => !d.open && onClose()}
      placement='start'
      size='xs'
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content bg='white' px='4' maxW='320px'>
          <Drawer.Header minH='64px'>
            <Drawer.CloseTrigger
              position='absolute'
              top='8px'
              right='12px'
              w='40px'
              h='40px'
              display='flex'
              alignItems='center'
              justifyContent='center'
              borderRadius='md'
              color='accent.400'
              cursor='pointer'
              _hover={{ bg: 'blackAlpha.100' }}
              aria-label='Menü bezárása'
            >
              <Box as={IoCloseSharp} boxSize='20px' />
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body>
            <Box as='ul' mt='10%' listStyleType='none'>
              {tree.map((item, i) => (
                <DrawerMenuItem
                  key={item.key}
                  item={item}
                  isLast={i === tree.length - 1}
                  onNavigate={onClose}
                />
              ))}
            </Box>
            <Flex mt='10' py='5' alignItems='center' gap='10px'>
              <SocialNav />
              <SearchButton
                ml='0'
                onClick={() => {
                  onClose()
                  onSearchOpen()
                }}
              />
            </Flex>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  )
}

function DrawerMenuItem({
  item,
  isLast,
  onNavigate,
}: {
  item: HierarchicalItem
  isLast: boolean
  onNavigate: () => void
}) {
  const [open, setOpen] = useState(false)
  const children = item.children ?? []
  const Chevron = open ? IoChevronUpSharp : IoChevronDownSharp

  return (
    <Box
      as='li'
      position='relative'
      mb='1'
      p='1'
      minH='40px'
      fontFamily='menu'
      textTransform='uppercase'
      color='black'
      bg='white'
      borderBottom={isLast ? '0' : '1px solid'}
      borderColor='black'
      transition='all 0.3s'
      _hover={{
        bg: 'rgba(236, 164, 25, 0.14)',
        borderColor: 'accent.400',
        color: 'accent.400',
      }}
    >
      <Box asChild pl='5' fontSize='20px'>
        <Link to={item.uri} onClick={onNavigate}>
          {item.title}
        </Link>
      </Box>
      {children.length > 0 && (
        <>
          <Box
            asChild
            display='inline-flex'
            verticalAlign='middle'
            pl='5'
            w='3rem'
            cursor='pointer'
          >
            <button
              type='button'
              aria-expanded={open}
              aria-label={`${item.title} almenü`}
              onClick={() => setOpen(!open)}
            >
              <Box as={Chevron} boxSize='2em' />
            </button>
          </Box>
          <Box
            as='ul'
            position='relative'
            ml='5'
            boxShadow='md'
            bg='white'
            zIndex='9'
            listStyleType='none'
            display={open ? 'block' : 'none'}
          >
            {children.map((child, i) => (
              <DrawerMenuItem
                key={child.key}
                item={child}
                isLast={i === children.length - 1}
                onNavigate={onNavigate}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
