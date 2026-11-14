import type { CodegenConfig } from '@graphql-codegen/cli'

// schema.graphql was saved from the remix clone on 2026-11-14, before the
// clone was deleted. Prod answers introspection only to logged-in users, so
// GRAPHQL_API can't point at it without credentials.
const config: CodegenConfig = {
  schema: process.env.GRAPHQL_API ?? './schema.graphql',
  generates: {
    './app/generated/types.ts': {
      plugins: ['typescript'],
      config: {
        avoidOptionals: true,
        useTypeImports: true,
      },
    },
  },
}

export default config
