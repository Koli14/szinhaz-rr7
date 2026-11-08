import { Box, Flex } from '@chakra-ui/react'
import MenuItem from './MenuItem'
import type { HierarchicalMenuItem } from './MenuItem'
import type { FlatMenuItem } from '~/types'

type ChildrenOf = Record<string, HierarchicalMenuItem[]>

function flatListToHierarchical(data: FlatMenuItem[]): HierarchicalMenuItem[] {
  const tree: HierarchicalMenuItem[] = []
  const childrenOf: ChildrenOf = {}

  data.forEach((item) => {
    const newItem: HierarchicalMenuItem = { ...item }
    const { key: id, parentId } = newItem
    childrenOf[id] = childrenOf[id] ?? []
    newItem.children = childrenOf[id]
    if (parentId) {
      childrenOf[parentId] = childrenOf[parentId] ?? []
      childrenOf[parentId].push(newItem)
    } else {
      tree.push(newItem)
    }
  })

  return tree
}

export default function Menu({ menuItems }: { menuItems: FlatMenuItem[] }) {
  const hierarchicalList = flatListToHierarchical(menuItems)

  return (
    <Box as='nav' width='100%' display={{ base: 'none', lg: 'block' }}>
      <Flex
        as='ul'
        justifyContent='center'
        listStyleType='none'
        align='center'
        bg='accent.400'
        minHeight='53px'
        lineHeight='53px'
        color='white'
        fontFamily='menu'
        letterSpacing='1.9px'
        fontSize='19px'
      >
        {hierarchicalList.map((menuItem, index) => (
          <MenuItem
            key={menuItem.key}
            menuItem={menuItem}
            isLast={hierarchicalList.length - 1 === index}
          />
        ))}
      </Flex>
    </Box>
  )
}
