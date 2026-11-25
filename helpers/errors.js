/**
 * @file HTTP error type and JSON:API-style error response helpers.
 * @module helpers/errors
 */

/**
 * An error that maps directly to an HTTP error response. Throw one from a
 * route handler and the application error handler turns it into JSON.
 */
export class HttpError extends Error {
  /**
   * Creates an HTTP error.
   * @param {number} status - HTTP status code.
   * @param {string} title - Short, human-readable summary of the problem.
   * @param {string} [detail] - Explanation specific to this occurrence.
   */
  constructor (status, title, detail) {
    super(detail ?? title)
    this.name = 'HttpError'
    /** @type {number} */
    this.status = status
    /** @type {string} */
    this.title = title
    /** @type {(string|undefined)} */
    this.detail = detail
  }

  /**
   * Creates a 400 Bad Request error.
   * @param {string} detail - What was wrong with the request.
   * @returns {HttpError} The error.
   */
  static badRequest (detail) {
    return new HttpError(400, 'Bad Request', detail)
  }

  /**
   * Creates a 404 Not Found error.
   * @param {string} [detail] - What could not be found.
   * @returns {HttpError} The error.
   */
  static notFound (detail) {
    return new HttpError(404, 'Not Found', detail)
  }
}

/**
 * Builds the JSON body for an error response.
 * @param {number} status - HTTP status code.
 * @param {string} title - Short summary of the problem.
 * @param {string} [detail] - Explanation specific to this occurrence.
 * @returns {{errors: Array<{status: string, title: string, detail?: string}>}} The response body.
 */
export const errorBody = (status, title, detail) => ({
  errors: [{ status: String(status), title, ...(detail && { detail }) }]
})
