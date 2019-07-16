const pdf = require('html-pdf');
const pug = require('pug');

const options = {
	format: 'A4',
	orientation: 'Portrait',
	border: '2.54cm',
	timeout: 100000
};

module.exports.createPDFStream = (template, values) => new Promise(((resolve, reject) => {
	const html = pug.renderFile(template, values);
	pdf.create(html, options).toStream((err, stream) => {
		if (err !== null) { reject(err); }
		else { resolve(stream); }
	});
}));