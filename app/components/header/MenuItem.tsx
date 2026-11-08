import { Box } from '@chakra-ui/react'
import { Link } from 'react-router'

export type HierarchicalMenuItem = {
  key: string
  parentId: string | null
  title: string
  uri: string
  children?: HierarchicalMenuItem[]
}

export default function MenuItem({
  menuItem,
  isLast,
}: {
  menuItem: HierarchicalMenuItem
  isLast: boolean
}) {
  return (
    <Box
      as='li'
      textTransform='uppercase'
      position='relative'
      zIndex='99'
      cursor='pointer'
    >
      <Box
        asChild
        px='1.375rem'
        borderRight={isLast ? '0px solid transparent' : '1px solid white'}
        display='block'
      >
        <Link to={menuItem.uri}>{menuItem.title}</Link>
      </Box>
    </Box>
  )
}
