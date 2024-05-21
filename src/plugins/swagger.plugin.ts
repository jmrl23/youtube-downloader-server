import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(async function swaggerPlugin(app) {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Youtube downloader API',
        version: '1.0.0',
        description:
          'Download videos from youtube in MP3 or MP4 format with the best quality available.',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Default local development server',
        },
      ],
      components: {
        securitySchemes: {},
      },
      security: [],
    },
    hideUntagged: true,
  });

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
});
