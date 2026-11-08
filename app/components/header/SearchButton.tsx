import { Box } from "@chakra-ui/react"
import { IoSearchSharp } from "react-icons/io5"

export default function SearchButton({ onClick }: { onClick?: () => void }) {
  return (
    <Box mr="2" ml={{ base: "auto" }}>
      <button
        type="button"
        aria-label="Keresés"
        onClick={onClick}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <Box
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          transition="background-color ease 0.25s"
          bg="accent.400"
          color="white"
          borderRadius="full"
          _hover={{ bg: "accent.500" }}
          boxSize="28px"
        >
          <Box boxSize="20px" color="white" as={IoSearchSharp} />
        </Box>
      </button>
    </Box>
  )
}
