import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FootballService {
  private readonly logger = new Logger(FootballService.name);
  private readonly espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200';

  /**
   * Fetches the current live and upcoming World Cup matches from the ESPN Public API.
   * ESPN API provides events, team names, logos, start times, and scores.
   */
  async getWorldCupScoreboard(): Promise<any[]> {
    try {
      const response = await axios.get(this.espnUrl);
      if (response.data && response.data.events) {
        return response.data.events;
      }
      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch ESPN API: ${error.message}`);
      return [];
    }
  }
}
