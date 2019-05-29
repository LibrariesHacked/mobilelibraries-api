const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');
const swaggerJsOptions = {
	swaggerDefinition: {
		info: {
			title: 'Mobile Libraries API',
			version: '1.0.0',
			description: 'API to retrieve data about mobile library stops and timetables.',
			contact: {
				name: "Libraries Hacked",
				url: "https://www.librarieshacked.org",
				email: "info@librarieshacked.org"
			},
		},
		openapi: '3.0.0'
	},
	apis: ['./routes/*.js']
};
const swaggerOptions = {
	customCss: '.swagger-ui .topbar { display: none }'
}

// Routes
const organisations = require('./routes/organisations');
const mobiles = require('./routes/mobiles');
const routes = require('./routes/routes');
const schema = require('./routes/schema');
const stops = require('./routes/stops');

// Set port to be 8080 for development, or the process environment for production/dev.
const port = process.env.PORT || 8080;

// Allow cross origin
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// Allow us to read JSON as JSON and text as text
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/csv' }));
app.use(bodyParser.urlencoded({ extended: false }));

// API routes
app.use('/api/organisations', organisations);
app.use('/api/mobiles', mobiles);
app.use('/api/routes', routes);
app.use('/api/schema', schema);
app.use('/api/stops', stops);

// Swagger documentation endpoint
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Listen for requests
app.listen(port);