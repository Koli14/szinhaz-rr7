import { Box } from "@chakra-ui/react"
import { IoMenuOutline } from "react-icons/io5"

export default function MobileMenu({ onClick }: { onClick?: () => void }) {
  return (
    <Box display={{ base: "flex", lg: "none" }} alignItems="center" mr="25px">
      <button
        type="button"
        aria-label="Menü"
        onClick={onClick}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <Box
          boxSize={10}
          color="white"
          as={IoMenuOutline}
          bg="accent.400"
          borderRadius="7px"
        />
      </button>
    </Box>
  )
}
