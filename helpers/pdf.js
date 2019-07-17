const PdfPrinter = require('pdfmake');

const styles = {
    header: {
        fontSize: 18,
        bold: true
    },
    normal: {
        fontSize: 12
    }
}

const fonts = {
    Roboto: {
        normal: './node_modules/typeface-roboto/files/roboto-latin-400.woff',
        bold: './node_modules/typeface-roboto/files/roboto-latin-500.woff',
        italics: './node_modules/typeface-roboto/files/roboto-latin-400italic.woff',
        bolditalics: './node_modules/typeface-roboto/files/roboto-latin-500italic.woff',
    }
};
const printer = new PdfPrinter(fonts);

module.exports.createPDFStream = (definition) => {

    let pdf = null;

    definition.styles = styles;

    try {
        pdf = printer.createPdfKitDocument(definition);
    } catch (e) { 
        console.log(e);
    }

    return pdf;
};