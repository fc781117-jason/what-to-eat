/** @type {import('next').NextConfig} */
const requestedBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const shouldExport = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(shouldExport
    ? {
        output: "export",
        basePath: requestedBasePath,
        assetPrefix: requestedBasePath,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
