const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const options = {
	swaggerDefinition: {
		info: {
			title: 'Mobile Libraries API',
			version: '1.0.0',
			description: 'API to retrieve data about mobile library stops and timetables.',
		},
	},
	apis: ['./routes/*.js']
};
const specs = swaggerJsdoc(options);

// Routes
const organisations = require('./routes/organisations');

// Set port to be 8080 for development, or the process environment for production/dev.
const port = process.env.PORT || 8080;

// Allow cross origin
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// Allow us to read JSON as JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// API routes
app.use('/api/organisations', organisations);

// Swagger documentation endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Listen for requests
app.listen(port);