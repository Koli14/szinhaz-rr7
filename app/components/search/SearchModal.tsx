"use client"
import { useRef } from "react"
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogBody,
  DialogCloseTrigger,
} from "@chakra-ui/react"
import { Box, Input } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import { IoCloseSharp, IoSearchSharp } from "react-icons/io5"

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) {
      onClose()
      navigate(`/search?s=${encodeURIComponent(q)}`)
    }
  }

  return (
    <DialogRoot
      open={open}
      onOpenChange={(d) => { if (!d.open) onClose() }}
      size="full"
    >
      <DialogBackdrop />
      <DialogContent bg="rgba(0,0,0,0.85)">
        <DialogBody display="flex" alignItems="center" justifyContent="center" h="100%">
          <Box w="100%" maxW="600px" px="4">
            <form onSubmit={handleSubmit}>
              <Box position="relative">
                <Input
                  ref={inputRef}
                  autoFocus
                  placeholder="Keresés..."
                  size="lg"
                  bg="white"
                  color="black"
                  borderRadius="full"
                  px="6"
                  pr="12"
                  fontSize="xl"
                  _placeholder={{ color: "gray.400" }}
                />
                <button
                  type="submit"
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "inherit",
                  }}
                >
                  <Box as={IoSearchSharp} boxSize="24px" color="accent.400" />
                </button>
              </Box>
            </form>
          </Box>
        </DialogBody>
        <DialogCloseTrigger
          position="fixed"
          top="4"
          right="4"
          color="white"
          bg="transparent"
          _hover={{ bg: "whiteAlpha.200" }}
          borderRadius="full"
        >
          <Box as={IoCloseSharp} boxSize="32px" />
        </DialogCloseTrigger>
      </DialogContent>
    </DialogRoot>
  )
}
