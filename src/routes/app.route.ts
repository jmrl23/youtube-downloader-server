import fs from 'node:fs';
import util from 'node:util';
import { FromSchema } from 'json-schema-to-ts';
import { asRoute } from '../lib/util/typings';
import {
  youtubeDownloadSchema,
  youtubeSearchSuggestionsSchema,
  youtubeVideoSearchSchema,
} from '../schemas/youtube-schema';
import YoutubeService from '../services/youtube.service';
import contentDisposition from 'content-disposition';
import sanitize from 'sanitize-filename';
import { memoryStore } from 'cache-manager';

export default asRoute(async function appRoute(app) {
  const cacheStore = memoryStore({ ttl: 0 });
  const youtubeService = await YoutubeService.createInstance(cacheStore);

  app

    .route({
      method: 'GET',
      url: '/suggestions',
      schema: {
        description: youtubeSearchSuggestionsSchema.description,
        security: [],
        tags: ['youtube'],
        querystring: youtubeSearchSuggestionsSchema,
      },
      async handler(request) {
        const { q, limit } = request.query as FromSchema<
          typeof youtubeSearchSuggestionsSchema
        >;
        const suggestions = await youtubeService.getSuggestions(q, limit);
        return { suggestions };
      },
    })

    .route({
      method: 'GET',
      url: '/videos',
      schema: {
        description: youtubeVideoSearchSchema.description,
        security: [],
        tags: ['youtube'],
        querystring: youtubeVideoSearchSchema,
      },
      async handler(request) {
        const { q, limit } = request.query as FromSchema<
          typeof youtubeVideoSearchSchema
        >;
        const videos = await youtubeService.getVideos(q, limit);
        return { videos };
      },
    })

    .route({
      method: 'GET',
      url: '/download/:videoId',
      schema: {
        description: youtubeDownloadSchema.description,
        security: [],
        tags: ['youtube'],
        params: youtubeDownloadSchema.properties.params,
        querystring: youtubeDownloadSchema.properties.querystring,
      },
      async handler(request, reply) {
        const { videoId } = request.params as FromSchema<
          typeof youtubeDownloadSchema.properties.params
        >;
        const { format } = request.query as FromSchema<
          typeof youtubeDownloadSchema.properties.querystring
        >;

        let info =
          format === 'mp3'
            ? await youtubeService.getMp3(videoId)
            : await youtubeService.getMp4(videoId);

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
});
