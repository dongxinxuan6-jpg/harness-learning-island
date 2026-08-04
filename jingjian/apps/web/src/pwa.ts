export const pwaGlobIgnores = ["data/**/*.json"];

export const dataRuntimeCache = {
  urlPattern: /\/data\//,
  handler: "NetworkFirst" as const,
  options: {
    cacheName: "jingjian-data",
    networkTimeoutSeconds: 3,
    expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 14 }
  }
};

export const productImageRuntimeCache = {
  urlPattern: /^https:\/\/cdn\.(sanity\.io|shopify\.com)\//,
  handler: "CacheFirst" as const,
  options: {
    cacheName: "jingjian-product-images",
    expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 30 }
  }
};
