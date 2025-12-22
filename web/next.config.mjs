/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for production Docker builds
    output: 'standalone',
    // Ignore ESLint errors during production builds
    // TODO: Fix all ESLint warnings properly before final release
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Ignore TypeScript errors during builds (for faster iteration)
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
