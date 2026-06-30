import { appConfig } from '@/common/config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface AiSessionState {
  session_id: string;
  user_id: number;
  agent_state: string;
  channel_id?: string | null;
  [key: string]: unknown;
}

export interface AiProposedAction {
  kind: 'create_booking' | 'cancel_booking' | 'reschedule';
  payload: Record<string, unknown>;
}

export interface AiToolResultSummary {
  name: string;
  ok: boolean;
  error_code?: string | null;
}

export interface AiMessageResponse {
  message: string;
  session_state: AiSessionState;
  proposed_action: AiProposedAction | null;
  requires_confirmation: boolean;
  tool_results_summary: AiToolResultSummary[];
  trace_id: string;
}

@Injectable()
export class AiPlatformClient {
  private readonly logger = new Logger(AiPlatformClient.name);
  private readonly http: AxiosInstance;
  private readonly sessionByChannel = new Map<string, string>();

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {
    this.http = axios.create({
      baseURL: this.config.aiBaseUrl.replace(/\/$/, ''),
      timeout: 70000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': this.config.aiInternalToken,
      },
    });
  }

  private cacheKey(userId: number, channelId?: string): string {
    return `${userId}:${channelId ?? 'direct'}`;
  }

  async createSession(userId: number, channelId?: string): Promise<{ sessionId: string }> {
    const resp = await this.http.post('/internal/ai/chat/sessions', {
      user_id: userId,
      channel_id: channelId,
    });
    return { sessionId: resp.data.session_id };
  }

  async getOrCreateSession(userId: number, channelId?: string): Promise<{ sessionId: string }> {
    const key = this.cacheKey(userId, channelId);
    const cached = this.sessionByChannel.get(key);
    if (cached) return { sessionId: cached };

    const session = await this.createSession(userId, channelId);
    this.sessionByChannel.set(key, session.sessionId);
    this.logger.debug(`Created AI session ${session.sessionId} for ${key}`);
    return session;
  }

  async postMessage(sessionId: string, message: string): Promise<AiMessageResponse> {
    const resp = await this.http.post(`/internal/ai/chat/sessions/${sessionId}/messages`, {
      message,
    });
    return resp.data;
  }

  async confirm(sessionId: string): Promise<AiMessageResponse> {
    const resp = await this.http.post(`/internal/ai/chat/sessions/${sessionId}/confirm`, {});
    return resp.data;
  }

  async cancel(sessionId: string): Promise<AiMessageResponse> {
    const resp = await this.http.post(`/internal/ai/chat/sessions/${sessionId}/cancel`, {});
    return resp.data;
  }

  async getSession(sessionId: string): Promise<AiSessionState> {
    const resp = await this.http.get(`/internal/ai/chat/sessions/${sessionId}`);
    return resp.data;
  }

  private isSessionNotFound(err: unknown): boolean {
    return axios.isAxiosError(err) && err.response?.status === 404;
  }

  private invalidate(userId: number, channelId?: string): void {
    this.sessionByChannel.delete(this.cacheKey(userId, channelId));
  }

  /**
   * Chạy fn với sessionId hiện tại; nếu AI báo 404 (session mất sau khi AI restart,
   * vì InMemory store) -> xoá cache, tạo lại session, retry 1 lần.
   */
  private async withFreshSession<T>(
    userId: number,
    channelId: string | undefined,
    fn: (sessionId: string) => Promise<T>,
  ): Promise<T> {
    const { sessionId } = await this.getOrCreateSession(userId, channelId);
    try {
      return await fn(sessionId);
    } catch (err) {
      if (!this.isSessionNotFound(err)) throw err;
      this.logger.warn(`AI session ${sessionId} stale, recreating`);
      this.invalidate(userId, channelId);
      const fresh = await this.getOrCreateSession(userId, channelId);
      return await fn(fresh.sessionId);
    }
  }

  async sendMessage(
    userId: number,
    channelId: string | undefined,
    message: string,
  ): Promise<AiMessageResponse> {
    return this.withFreshSession(userId, channelId, (sid) =>
      this.postMessage(sid, message),
    );
  }

  async confirmForChannel(userId: number, channelId?: string): Promise<AiMessageResponse> {
    return this.withFreshSession(userId, channelId, (sid) => this.confirm(sid));
  }

  async cancelForChannel(userId: number, channelId?: string): Promise<AiMessageResponse> {
    return this.withFreshSession(userId, channelId, (sid) => this.cancel(sid));
  }
}
