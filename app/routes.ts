import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route(":postSlug", "routes/post.tsx"),
] satisfies RouteConfig
