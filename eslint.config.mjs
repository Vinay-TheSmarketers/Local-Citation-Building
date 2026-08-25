import { FlatCompat } from "@eslint/eslintrc"
import { dirname } from "path"
import { fileURLToPath } from "url"

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: currentDirectory })

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "artifacts/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
]

export default eslintConfig
