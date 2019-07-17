const PdfPrinter = require('pdfmake');

const fonts = {
    Roboto: {
        normal: './node_modules/typeface-roboto/files/roboto-latin-400.woff',
        bold: './node_modules/typeface-roboto/files/roboto-latin-500.woff',
        italics: './node_modules/typeface-roboto/files/roboto-latin-400italic.woff',
        bolditalics: './node_modules/typeface-roboto/files/roboto-latin-500italic.woff',
    }
};
const printer = new PdfPrinter(fonts);

module.exports.createPDFStream = () => {
    const docDefinition = {
        content: [
            'First paragraph',
            'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines'
        ]
    };

    let pdf = null;

    try {
        pdf = printer.createPdfKitDocument(docDefinition);
    } catch (e) {
        console.log(e);
    }
    

    return pdf;
};