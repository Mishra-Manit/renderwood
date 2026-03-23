import { fileURLToPath } from 'url'

const turbopackRoot = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: turbopackRoot,
  },
  devIndicators: false,
}

export default nextConfig
