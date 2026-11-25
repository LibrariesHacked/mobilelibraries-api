/**
 * @file In-memory response cache middleware.
 * @module middleware/cache
 */

/**
 * A cached response.
 * @typedef {object} CacheEntry
 * @property {(string|Buffer)} body - Response body.
 * @property {Record<string, (string|number|string[])>} headers - Response headers to replay.
 * @property {number} expires - Expiry time in milliseconds since the epoch.
 */

/** Upper bound on cached responses, so map tiles can't grow memory without limit. */
const MAX_ENTRIES = 2000

/** Headers that are recalculated per response and must not be replayed. */
const SKIPPED_HEADERS = new Set(['content-length', 'date', 'etag', 'x-powered-by'])

/** @type {Map<string, CacheEntry>} */
const store = new Map()

/**
 * Stores a response, evicting the oldest entry if the cache is full.
 * @param {string} key - Cache key.
 * @param {CacheEntry} entry - The response to store.
 */
const put = (key, entry) => {
  store.delete(key)
  if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value)
  store.set(key, entry)
}

/**
 * Gets a cached response if it hasn't expired.
 * @param {string} key - Cache key.
 * @returns {(CacheEntry|undefined)} The entry, or undefined.
 */
const get = key => {
  const entry = store.get(key)
  if (entry && entry.expires <= Date.now()) {
    store.delete(key)
    return undefined
  }
  return entry
}

/**
 * Empties the cache. Mainly useful in tests.
 * @returns {void}
 */
export const clearCache = () => store.clear()

/**
 * Creates middleware that caches successful responses in memory and tells
 * browsers and CDNs they may cache them too. The cache key includes the
 * `Accept` header, because several endpoints negotiate their format.
 * Only 200 responses are cached.
 * @param {number} seconds - How long to keep responses.
 * @returns {import('express').RequestHandler} The middleware.
 */
const cache = seconds => (req, res, next) => {
  res.set('Cache-Control', `public, max-age=${seconds}`)

  const key = `${req.originalUrl}::${req.get('Accept') ?? ''}`
  const cached = get(key)
  if (cached) {
    res.set(cached.headers)
    res.set('X-Cache', 'HIT')
    res.send(cached.body)
    return
  }

  const send = res.send.bind(res)
  res.send = body => {
    if (res.statusCode === 200) {
      const headers = Object.fromEntries(
        Object.entries(res.getHeaders()).filter(([name]) => !SKIPPED_HEADERS.has(name))
      )
      put(key, { body, headers, expires: Date.now() + seconds * 1000 })
    }
    return send(body)
  }
  next()
}

export default cache
