/**
 * @file Renders PDF documents with pdfmake, using the Roboto fonts that ship
 * with pdfmake itself.
 * @module helpers/pdf
 */

import { createRequire } from 'node:module'
import pdfmake from 'pdfmake'

const require = createRequire(import.meta.url)

/** Font definitions bundled with pdfmake. */
const fonts = require('pdfmake/fonts/Roboto.js')

/** Text styles available to document definitions. */
const styles = {
  header: { fontSize: 18, bold: true },
  smallheader: { fontSize: 11, bold: true },
  subheader: { fontSize: 14, bold: true },
  normal: { fontSize: 12 }
}

/** Custom table layouts available to document definitions. */
const tableLayouts = {
  librariesLayout: {
    hLineWidth: () => 1,
    hLineColor: () => '#e5e5e5',
    vLineWidth: () => 1,
    vLineColor: () => '#e5e5e5',
    paddingLeft: () => 10,
    paddingRight: () => 10,
    paddingTop: () => 10,
    paddingBottom: () => 10
  }
}

pdfmake.setFonts(fonts)
pdfmake.addTableLayouts(tableLayouts)
pdfmake.setUrlAccessPolicy(() => false)
pdfmake.setLocalAccessPolicy(() => true)

/**
 * Renders a pdfmake document definition to a PDF Buffer.
 * @param {object} definition - A pdfmake document definition.
 * @returns {Promise<Buffer>} The PDF file contents.
 */
export const createPdf = definition =>
  pdfmake.createPdf({ ...definition, styles }).getBuffer()

/**
 * Backward compatibility helper returning a PDFKit readable stream.
 * @param {object} definition - A pdfmake document definition.
 * @returns {Promise<object>} The readable stream.
 */
export const createPDFStream = definition =>
  pdfmake.createPdf({ ...definition, styles }).getStream()

export default {
  createPdf,
  createPDFStream
}
