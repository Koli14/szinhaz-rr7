import { Box, Flex } from "@chakra-ui/react"
import { IoLogoFacebook, IoLogoInstagram } from "react-icons/io5"
import { socialLinks } from "~/utils/helpers"

const icons: Record<string, React.ElementType> = {
  facebook: IoLogoFacebook,
  instagram: IoLogoInstagram,
}

export default function SocialNav() {
  return (
    <Flex alignItems="center">
      {socialLinks.map(([name, link]) => {
        const Icon = icons[name]
        return (
          <Box
            as="li"
            key={name}
            color="black"
            transition="all 0.3s"
            _hover={{ color: "accent.400" }}
            listStyleType="none"
            mx="2"
          >
            <a href={link} target="_blank" rel="noopener noreferrer" aria-label={name}>
              <Box as={Icon} boxSize="25px" />
            </a>
          </Box>
        )
      })}
    </Flex>
  )
}
