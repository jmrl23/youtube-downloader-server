import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import childProcess from 'node:child_process';
import qs from 'qs';
import CacheService from './cache.service';
import ffmpegPath from 'ffmpeg-static';
import mimeTypes from 'mime-types';
import os from 'node:os';
import yts, {
  type VideoSearchResult,
  type VideoMetadataResult,
} from 'yt-search';
import { memoryStore, type Store } from 'cache-manager';
import { InternalServerError } from 'http-errors';

export default class YoutubeService {
  private static instance: YoutubeService;
  private static binDir = path.resolve(__dirname, '../../.bin');
  private static ytDlp = path.resolve(YoutubeService.binDir, 'yt-dlp');
  private static tmpDir = os.tmpdir();

  private constructor(private readonly cacheService: CacheService) {}

  public static async createInstance(
    store?: Store | Promise<Store>,
  ): Promise<YoutubeService> {
    const cacheService = await CacheService.createInstance(store);
    const instance = new YoutubeService(cacheService);

    return instance;
  }

  public static async getInstance(): Promise<YoutubeService> {
    if (!YoutubeService.instance) {
      YoutubeService.instance = await YoutubeService.createInstance(
        memoryStore({
          ttl: 30 * 1000,
        }),
      );
    }

    return YoutubeService.instance;
  }

  public async getSuggestions(
    query: string,
    limit?: number,
  ): Promise<string[]> {
    const cachedSuggestions = await this.cacheService.get<string[]>(
      `suggestion:${query}`,
    );

    if (cachedSuggestions) return cachedSuggestions.slice(0, limit);

    try {
      const url = `http://suggestqueries.google.com/complete/search?client=youtube&output=toolbar&client=firefox&hl=en&${qs.stringify({ q: query })}`;
      const response = await fetch(url);
      const data = await response.json();
      const [, result] = data as [unknown, string[]];
      const suggestions = result.map((suggestion) =>
        suggestion.replace(/\\u[\dA-F]{4}/gi, (match) =>
          String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)),
        ),
      );

      await this.cacheService.set(`suggestion:list:${query}`, suggestions);

      return suggestions.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  public async getVideos(
    query: string,
    limit?: number,
  ): Promise<VideoSearchResult[]> {
    const cachedVideos = await this.cacheService.get<VideoSearchResult[]>(
      `video:${query}`,
    );

    if (cachedVideos) return cachedVideos.slice(0, limit);

    const result = await yts.search(query);
    const videos = result.videos;

    await this.cacheService.set(`video:list:${query}`, videos);

    return videos.slice(0, limit);
  }

  public async getMp3(videoId: string): Promise<Info> {
    const info = await this.generateFile(videoId, 'mp3');

    return info;
  }

  public async getMp4(videoId: string): Promise<Info> {
    const info = await this.generateFile(videoId, 'mp4');

    return info;
  }

  private async generateFile(
    videoId: string,
    format: 'mp3' | 'mp4',
  ): Promise<Info> {
    const binFiles = fs.readdirSync(YoutubeService.binDir, {
      recursive: false,
    }) as string[];

    if (
      Array.isArray(binFiles) &&
      !binFiles.some((fileName) => fileName.startsWith('yt-dlp'))
    ) {
      throw new InternalServerError('No yt-dlp detected');
    }

    const videoInfo = await this.getVideoInfo(videoId);
    const fileName = path.resolve(
      YoutubeService.tmpDir,
      `${crypto.randomUUID()}`,
    );
    const cmd =
      format === 'mp3'
        ? `${YoutubeService.ytDlp} --ffmpeg-location "${ffmpegPath}" -o "${fileName}" -f bestaudio[ext=m4a]/bestaudio -- "${videoId}" && ${ffmpegPath} -i "${fileName}" -vn -ar 44100 -ac 2 -b:a 192k "${fileName}.mp3"`
        : `${YoutubeService.ytDlp} --ffmpeg-location "${ffmpegPath}" -o "${fileName}" -f bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio --merge-output-format mp4 -- "${videoId}"`;

    const filePath = await new Promise<string>(function (resolve, reject) {
      childProcess.exec(cmd, async function (error) {
        if (error) {
          reject(new InternalServerError(error.message));

          return;
        }

        if (format === 'mp3') {
          fs.unlinkSync(fileName);
        }

        resolve(`${fileName}.${format}`);
      });
    });

    const fileInfo = await this.getFileInfo(filePath);

    return {
      videoInfo,
      fileInfo,
    };
  }

  private async getFileInfo(path: string): Promise<FileInfo> {
    const stat = fs.statSync(path);
    const mime = mimeTypes.lookup(path) || 'application/octet-stream';
    const fileInfo = {
      path,
      size: stat.size,
      mime,
    };

    return fileInfo;
  }

  private async getVideoInfo(videoId: string): Promise<VideoInfo> {
    const cachedVideoInfo = await this.cacheService.get<VideoInfo>(
      `video:info:${videoId}`,
    );

    if (cachedVideoInfo) return cachedVideoInfo;

    try {
      const videoInfo = await yts({ videoId });

      await this.cacheService.set(`video:info:${videoId}`, videoInfo);

      return videoInfo;
    } catch (error) {
      if (typeof error === 'string') {
        error = new Error(error);
      }

      if (error instanceof Error) throw error;

      throw new Error('An error occurs');
    }
  }
}

export interface FileInfo {
  path: string;
  size: number;
  mime?: string;
}

export interface VideoInfo extends VideoMetadataResult {}

export interface Info {
  videoInfo: VideoInfo;
  fileInfo: FileInfo;
}
