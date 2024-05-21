import { memoryStore } from 'cache-manager';
import YoutubeService from './youtube.service';

export default class AppService {
  private static instance: AppService;

  private constructor(private readonly youtubeService: YoutubeService) {}

  public static async createInstance(): Promise<AppService> {
    const youtubeService = await YoutubeService.createInstance(
      memoryStore({
        ttl: 30 * 1000,
      }),
    );
    const instance = new AppService(youtubeService);

    return instance;
  }

  public static async getInstance(): Promise<AppService> {
    if (!AppService.instance) {
      const instance = await AppService.createInstance();

      AppService.instance = instance;
    }

    return AppService.instance;
  }

  public getSuggestions = this.youtubeService.getSuggestions.bind(
    this.youtubeService,
  );

  public getVideos = this.youtubeService.getVideos.bind(this.youtubeService);

  public getMp3 = this.youtubeService.getMp3.bind(this.youtubeService);

  public getMp4 = this.youtubeService.getMp4.bind(this.youtubeService);
}
