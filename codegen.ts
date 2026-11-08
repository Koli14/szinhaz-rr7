import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: process.env.GRAPHQL_API ?? 'https://remix.szinhaz.online/graphql',
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
