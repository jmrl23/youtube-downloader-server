import { asJsonSchema } from '../lib/util/typings';

export const youtubeSearchSuggestionsSchema = asJsonSchema({
  type: 'object',
  description: 'Search suggestions',
  additionalProperties: false,
  required: ['q'],
  properties: {
    q: {
      type: 'string',
    },
    limit: {
      type: 'integer',
      minimum: 0,
    },
  },
} as const);

export const youtubeVideoSearchSchema = asJsonSchema({
  type: 'object',
  description: 'Search youtube video',
  additionalProperties: false,
  required: ['q'],
  properties: {
    q: {
      type: 'string',
    },
    limit: {
      type: 'integer',
      minimum: 0,
    },
  },
} as const);

export const youtubeDownloadSchema = asJsonSchema({
  type: 'object',
  description: 'Download video',
  additionalProperties: false,
  required: ['params', 'querystring'],
  properties: {
    params: {
      type: 'object',
      required: ['videoId'],
      properties: {
        videoId: {
          type: 'string',
        },
      },
    },
    querystring: {
      type: 'object',
      required: ['format'],
      properties: {
        format: {
          type: 'string',
          enum: ['mp3', 'mp4'],
        },
      },
    },
  },
} as const);
