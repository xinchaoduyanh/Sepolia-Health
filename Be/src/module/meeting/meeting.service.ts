import { appConfig } from '@/common/config';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { CreateMeetingType, CreateMeetingResponseType } from './meeting.type';

@Injectable()
export class MeetingService {
  private accessToken: string | null = null;
  private expriesIn: number = 0;
  constructor(
    @Inject(appConfig.KEY)
    private readonly zoomConf: ConfigType<typeof appConfig>,
  ) {}

  private async getAccessToken() {
    if (this.accessToken && Date.now() < this.expriesIn) {
      return this.accessToken;
    }

    const tokenBase64 = Buffer.from(
      `${this.zoomConf.zoomClientId}:${this.zoomConf.zoomClientSecret}`,
    ).toString('base64');
    const res = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.zoomConf.zoomAccountId}`,
      null,
      {
        headers: {
          Authorization: `Basic ${tokenBase64}`,
          Content_Type: 'application / x - www - form - urlencoded',
        },
      },
    );

    this.accessToken = res.data.access_token;
    this.expriesIn = Date.now() + res.data.expires_in * 1000 - 5000;
    return this.accessToken;
  }

  async createMeeting(
    body: CreateMeetingType,
  ): Promise<CreateMeetingResponseType> {
    const token = await this.getAccessToken();
    const res = await axios.post(
      `https://api.zoom.us/v2/users/me/meetings`,
      {
        ...body,
        type: 2,
        duration: 40,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      join_url: res.data.join_url,
      start_url: res.data.start_url,
    };
  }
}
