import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CHATBOT_QUEUE } from './chatbot.constant';
import { ChatbotService, StreamAiMessageJob } from './chatbot.service';

@Processor(CHATBOT_QUEUE.NAME, { concurrency: 4 })
export class ChatbotProcessor extends WorkerHost {
  private readonly logger = new Logger(ChatbotProcessor.name);

  constructor(private readonly chatbotService: ChatbotService) {
    super();
  }

  async process(job: Job<StreamAiMessageJob>): Promise<void> {
    const { channelId, text, userId } = job.data;
    const result = await this.chatbotService.processMessageAndReply(
      channelId,
      text,
      userId,
    );
    if (!result.delivered) {
      throw new Error('stream_reply_not_delivered');
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<StreamAiMessageJob> | undefined, error: Error): void {
    this.logger.error(
      `Stream AI job ${job?.id ?? 'unknown'} failed: ${error.message}`,
      error.stack,
    );
  }
}

