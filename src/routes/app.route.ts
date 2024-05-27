import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Info } from '../services/youtube.service';
import { InternalServerError } from 'http-errors';
import sanitize from 'sanitize-filename';
import contentDisposition from 'content-disposition';
import fs from 'node:fs';
import util from 'node:util';
import AppService from '../services/app.service';

export const autoPrefix = '/';

export default async function appRoute(app: FastifyInstance) {
  const appService = await AppService.getInstance();

  app

    .route({
      method: 'GET',
      url: '/',
      handler(_, reply) {
        reply.redirect('/docs');
      },
    })

    .route({
      method: 'GET',
      url: '/suggestions',
      schema: {
        description: 'Get list of suggestions',
        tags: ['youtube'],
        querystring: {
          type: 'object',
          properties: {
            q: {
              type: 'string',
            },
            limit: {
              type: 'integer',
            },
          },
          required: ['q'],
        },
      },
      async handler(
        request: FastifyRequest<{
          Querystring: {
            q: string;
            limit?: number;
          };
        }>,
      ) {
        const { q: query, limit } = request.query;
        const suggestions = await appService.getSuggestions(query, limit);

        return {
          suggestions,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/videos',
      schema: {
        description: 'Get list of videos',
        tags: ['youtube'],
        querystring: {
          type: 'object',
          properties: {
            q: {
              type: 'string',
            },
            limit: {
              type: 'integer',
            },
          },
          required: ['q'],
        },
      },
      async handler(
        request: FastifyRequest<{
          Querystring: {
            q: string;
            limit?: number;
          };
        }>,
      ) {
        const { q: query, limit } = request.query;
        const videos = await appService.getVideos(query, limit);

        return {
          videos,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/download/:video_id',
      schema: {
        description: 'Download file',
        tags: ['youtube'],
        querystring: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['mp3', 'mp4'],
            },
          },
          required: ['format'],
        },
        params: {
          type: 'object',
          properties: {
            video_id: {
              type: 'string',
            },
          },
          required: ['video_id'],
        },
      },
      async handler(
        request: FastifyRequest<{
          Querystring: {
            format: string;
          };
          Params: {
            video_id: string;
          };
        }>,
        reply,
      ) {
        const format = request.query.format;
        const videoId = request.params.video_id;

        let info: Info | null = null;

        switch (format) {
          case 'mp3':
            info = await appService.getMp3(videoId);
            break;
          case 'mp4':
            info = await appService.getMp4(videoId);
            break;
        }

        if (!info?.fileInfo) throw new InternalServerError();

        reply.header('Content-Length', info.fileInfo.size);
        reply.header('Content-Type', info.fileInfo.mime);
        reply.header('Cache-Control', 'max-age=3600');
        reply.header(
          'Content-Disposition',
          `attachment; filename=${contentDisposition(sanitize(`${info.videoInfo.title}.${format}`))}`,
        );
        reply.then(
          async () => {
            void util.promisify(fs.unlinkSync)(info.fileInfo.path);
          },
          async (error) => {
            void util.promisify(fs.unlinkSync)(info.fileInfo.path);
            throw error;
          },
        );

        const readStream = fs.createReadStream(info.fileInfo.path);

        return readStream;
      },
    });
}
