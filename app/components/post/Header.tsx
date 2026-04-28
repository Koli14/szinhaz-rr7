import { Box, Heading, Text } from "@chakra-ui/react"
import { Tag } from "~/components/Tags"
import { formatDate } from "~/utils/helpers"
import type { Post } from "~/types"

export const PostHeader = ({ post }: { post: Post }) => {
  const { kiemeltCimke, tags, title, date } = post
  const tag = kiemeltCimke.featuredTag ?? tags.nodes[0]

  return (
    <Box>
      {tag && <Tag tag={tag} />}
      <Heading
        fontWeight="bold"
        lineHeight="1.25"
        size="lg"
        fontSize={{ base: "1.0625rem", lg: "1.875rem" }}
        mt="5"
        mb={{ base: "3", lg: "3" }}
        textTransform="uppercase"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <Text fontSize={{ base: "0.75rem", lg: "1rem" }} mt="12px">
        {formatDate(date)}
      </Text>
    </Box>
  )
}
