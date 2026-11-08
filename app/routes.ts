import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("galeria", "routes/gallery.tsx"),
  route("galeria/:gallerySlug", "routes/gallery-single.tsx"),
  route("folder/:folderSlug", "routes/folder.tsx"),
  route("tags/:tagSlug", "routes/tag.tsx"),
  route("category/:categorySlug", "routes/category.tsx"),
  route(":postSlug", "routes/post.tsx"),
] satisfies RouteConfig
