const mcache = require('memory-cache')

const cache = duration => {
  return (req, res, next) => {
    const key =
      '__express__' +
      (req.originalUrl || req.url) +
      '__' +
      (req.get('Accept') || '')
    const cached = mcache.get(key)
    if (cached) {
      if (cached.contentType) {
        res.setHeader('Content-Type', cached.contentType)
      }
      res.send(cached.body)
    } else {
      res.sendResponse = res.send
      res.send = body => {
        const contentType = res.getHeader('Content-Type')
        mcache.put(key, { body, contentType }, duration * 1000)
        res.sendResponse(body)
      }
      next()
    }
  }
}

module.exports = cache
