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
  private readonly sessionByChannel = new Map<
    string,
    { sessionId: string; expiresAt: number }
  >();

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

  private static readonly CACHE_PRUNE_THRESHOLD = 1000;

  private pruneExpiredSessions(): void {
    const now = Date.now();
    for (const [key, entry] of this.sessionByChannel) {
      if (entry.expiresAt <= now) this.sessionByChannel.delete(key);
    }
  }

  private cacheSession(key: string, sessionId: string): void {
    // Map chỉ là cache cục bộ (DB AiSession là source of truth); không để giữ
    // key hết hạn vô hạn nếu user không quay lại.
    if (this.sessionByChannel.size >= AiPlatformClient.CACHE_PRUNE_THRESHOLD) {
      this.pruneExpiredSessions();
    }
    this.sessionByChannel.set(key, {
      sessionId,
      expiresAt: Date.now() + this.config.aiSessionCacheTtlSeconds * 1000,
    });
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
    if (cached && cached.expiresAt > Date.now()) {
      return { sessionId: cached.sessionId };
    }
    if (cached) this.sessionByChannel.delete(key);

    const session = await this.createSession(userId, channelId);
    this.cacheSession(key, session.sessionId);
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

  /** Session đã xóa/retention-close (AI get() → None) hoặc 410 closed. */
  private isSessionStale(err: unknown): boolean {
    if (!axios.isAxiosError(err)) return false;
    const status = err.response?.status;
    return status === 404 || status === 410;
  }

  private invalidate(userId: number, channelId?: string): void {
    this.sessionByChannel.delete(this.cacheKey(userId, channelId));
  }

  /**
   * Chạy fn với sessionId hiện tại; nếu AI báo 404/410 (delete, retention,
   * restart store) -> xoá Map cache, tạo session mới, retry 1 lần.
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
      if (!this.isSessionStale(err)) throw err;
      this.logger.warn(`AI session ${sessionId} stale (404/410), recreating`);
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
    const resp = await this.withFreshSession(userId, channelId, (sid) =>
      this.postMessage(sid, message),
    );
    if (
      resp.session_state?.agent_state === 'booked' ||
      resp.session_state?.agent_state === 'handoff_or_failed'
    ) {
      this.invalidate(userId, channelId);
    }
    return resp;
  }

  async streamMessage(
    sessionId: string,
    message: string,
    onChunk: (chunk: string) => void,
  ): Promise<AiMessageResponse> {
    const resp = await this.http.post(
      `/internal/ai/chat/sessions/${sessionId}/messages/stream`,
      { message },
      { responseType: 'stream' },
    );

    return new Promise((resolve, reject) => {
      let finalState: AiMessageResponse | null = null;
      let streamError: Error | null = null;
      let buffer = '';

      resp.data.on('data', (chunkBuffer: Buffer) => {
        buffer += chunkBuffer.toString();
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              // SSE của AI có type (AI/app/api/chat.py::stream_message):
              // chunk = text từng đoạn, final = MessageResponse đầy đủ,
              // error = lỗi đã che chi tiết nội bộ.
              if (data.type === 'chunk' && typeof data.text === 'string') {
                onChunk(data.text);
              } else if (data.type === 'final' && data.response) {
                finalState = data.response;
              } else if (data.type === 'error') {
                streamError = new Error(data.message || 'AI stream error');
              }
            } catch (e) {
              this.logger.error('Failed to parse SSE line', e);
            }
          }
        }
      });

      resp.data.on('end', () => {
        if (streamError) reject(streamError);
        else if (finalState) resolve(finalState);
        else reject(new Error('Stream ended without final response'));
      });
      
      resp.data.on('error', (err: any) => reject(err));
    });
  }

  async streamMessageForChannel(
    userId: number,
    channelId: string | undefined,
    message: string,
    onChunk: (chunk: string) => void,
  ): Promise<AiMessageResponse> {
    // withFreshSession: HTTP 404/410 từ stream endpoint (session closed) sẽ
    // drop Map cache và mở session mới — không kẹt sessionId đã retention/delete.
    const resp = await this.withFreshSession(userId, channelId, (sid) =>
      this.streamMessage(sid, message, onChunk),
    );
    if (
      resp.session_state?.agent_state === 'booked' ||
      resp.session_state?.agent_state === 'handoff_or_failed'
    ) {
      this.invalidate(userId, channelId);
    }
    // Cache session id mới từ response (phòng createSession reconnect trả id khác).
    if (resp.session_state?.session_id && channelId) {
      this.cacheSession(
        this.cacheKey(userId, channelId),
        resp.session_state.session_id,
      );
    }
    return resp;
  }

  async confirmForChannel(userId: number, channelId?: string): Promise<AiMessageResponse> {
    const resp = await this.withFreshSession(userId, channelId, (sid) => this.confirm(sid));
    if (
      resp.session_state?.agent_state === 'booked' ||
      resp.session_state?.agent_state === 'handoff_or_failed'
    ) {
      this.invalidate(userId, channelId);
    }
    return resp;
  }

  async cancelForChannel(userId: number, channelId?: string): Promise<AiMessageResponse> {
    const resp = await this.withFreshSession(userId, channelId, (sid) => this.cancel(sid));
    if (
      resp.session_state?.agent_state === 'booked' ||
      resp.session_state?.agent_state === 'handoff_or_failed'
    ) {
      this.invalidate(userId, channelId);
    }
    return resp;
  }
}
