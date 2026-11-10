import { Box } from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router'

export type HierarchicalMenuItem = {
  key: string
  parentId: string | null
  title: string
  uri: string
  children?: HierarchicalMenuItem[]
}

// Top-level items are separated by a text-high white line; children open in
// a white dropdown on hover or keyboard focus (same look as on Frontity).
export default function MenuItem({
  menuItem,
  isLast = true,
  isChild = false,
}: {
  menuItem: HierarchicalMenuItem
  isLast?: boolean
  isChild?: boolean
}) {
  const [open, setOpen] = useState(false)
  const children = menuItem.children ?? []

  return (
    <Box
      as='li'
      textTransform='uppercase'
      position='relative'
      zIndex='99'
      cursor='pointer'
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
      {...(isChild && {
        p: '1',
        borderBottom: '1px solid #BFBFBF',
        _last: { borderBottom: '0' },
      })}
    >
      <Box
        asChild
        px='1.375rem'
        borderRight={isLast ? '0' : '1px solid white'}
        transition='opacity 0.5s ease'
        _hover={{ opacity: 0.5 }}
      >
        <Link to={menuItem.uri} onClick={() => setOpen(false)}>
          {menuItem.title}
        </Link>
      </Box>
      {children.length > 0 && (
        <Box
          as='ul'
          listStyleType='none'
          position='absolute'
          top='53px'
          left='12px'
          px='5'
          py='3'
          bg='white'
          color='black'
          lineHeight='25px'
          display={open ? 'block' : 'none'}
        >
          {children.map((child) => (
            <MenuItem key={child.key} menuItem={child} isChild />
          ))}
        </Box>
      )}
    </Box>
  )
}
