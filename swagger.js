const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BMAD Meal Planner API',
      version: '1.0.0',
      description: 'API documentation for the BMAD Meal Planner application.',
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [{
        bearerAuth: []
    }]
  },
  apis: ['./src/app/api/**/*.ts'], // files containing annotations
};

module.exports = swaggerJsdoc(options);
