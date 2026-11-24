const path = require('path')
const pdfmake = require('pdfmake')

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

// Resolve Roboto font files robustly relative to typeface-roboto package location
let robotoDir
try {
  robotoDir = path.dirname(require.resolve('typeface-roboto/package.json'))
} catch (e) {
  robotoDir = path.join(__dirname, '../node_modules/typeface-roboto')
}

const fonts = {
  Roboto: {
    normal: path.join(robotoDir, 'files/roboto-latin-400.woff'),
    bold: path.join(robotoDir, 'files/roboto-latin-500.woff'),
    italics: path.join(robotoDir, 'files/roboto-latin-400italic.woff'),
    bolditalics: path.join(robotoDir, 'files/roboto-latin-500italic.woff')
  }
}

pdfmake.setFonts(fonts)
pdfmake.setUrlAccessPolicy(() => true)
pdfmake.setLocalAccessPolicy(() => true)

module.exports.createPDFStream = async definition => {
  definition.styles = styles

  try {
    const doc = pdfmake.createPdf(definition, {
      tableLayouts: tableLayouts
    })
    return await doc.getStream()
  } catch (e) {
    console.error('Error creating PDF document:', e)
    return null
  }
}
