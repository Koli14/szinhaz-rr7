import { Box, Flex, Heading } from "@chakra-ui/react"
import { Link } from "react-router"
import { Tag } from "~/components/Tags"
import type { PostPreview } from "~/types"

export function ArchiveItem({
  item,
  featured = false,
}: {
  item: PostPreview
  featured?: boolean
}) {
  const image = item.featuredImage?.node
  const src = image?.mediaDetails.sizes.find((s) => s.name === "medium")?.sourceUrl
    ?? image?.sourceUrl
  const tag = item.kiemeltCimke.featuredTag?.nodes?.[0] ?? item.tags.nodes[0]

  return (
    <Flex
      as="article"
      direction={{ base: "column", md: "row" }}
      py="5"
      borderBottom="1px solid"
      borderColor="gray.200"
      gap={{ base: 3, md: 0 }}
    >
      {src && (
        <Box
          flexShrink={0}
          width={{ base: "100%", md: featured ? "55%" : "40%" }}
          mr={{ md: "6" }}
        >
          <Link to={`/${item.slug}`}>
            <Box aspectRatio={9 / 5} overflow="hidden">
              <img
                src={src}
                alt={image?.altText}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          </Link>
        </Box>
      )}
      <Flex direction="column" flex={1} justify="center">
        {tag && (
          <Box mb="2">
            <Tag tag={tag} />
          </Box>
        )}
        <Link to={`/${item.slug}`}>
          <Heading
            as="h4"
            fontFamily="heading"
            fontSize={featured ? "1.6875rem" : "1.375rem"}
            fontWeight="500"
            lineHeight="1.25"
            textTransform="uppercase"
            mb="3"
            dangerouslySetInnerHTML={{ __html: item.title }}
          />
        </Link>
        <Box
          flex={1}
          color="gray.700"
          fontSize="0.9375rem"
          dangerouslySetInnerHTML={{ __html: item.excerpt }}
        />
      </Flex>
    </Flex>
  )
}
