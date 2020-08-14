const PdfPrinter = require('pdfmake')

const styles = {
  header: {
    fontSize: 18,
    bold: true
  },
  smallheader: {
    fontSize: 11,
    bold: true
  },
  subheader: {
    fontSize: 14,
    bold: true
  },
  normal: {
    fontSize: 12
  }
}

const tableLayouts = {
  librariesLayout: {
    hLineWidth: function (i) {
      return 1
    },
    hLineColor: function (i) {
      return '#e5e5e5'
    },
    vLineWidth: function (i) {
      return 1
    },
    vLineColor: function (i) {
      return '#e5e5e5'
    },
    paddingLeft: function (i) {
      return 10
    },
    paddingRight: function (i) {
      return 10
    },
    paddingTop: function (i) {
      return 10
    },
    paddingBottom: function (i) {
      return 10
    }
  }
}

const fonts = {
  Roboto: {
    normal: './node_modules/typeface-roboto/files/roboto-latin-400.woff',
    bold: './node_modules/typeface-roboto/files/roboto-latin-500.woff',
    italics: './node_modules/typeface-roboto/files/roboto-latin-400italic.woff',
    bolditalics: './node_modules/typeface-roboto/files/roboto-latin-500italic.woff'
  }
}

const printer = new PdfPrinter(fonts)

module.exports.createPDFStream = (definition) => {
  let pdf = null

  definition.styles = styles

  try {
    pdf = printer.createPdfKitDocument(definition, { tableLayouts: tableLayouts })
  } catch (e) { }

  return pdf
}
