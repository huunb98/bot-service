import TelegramBot from "node-telegram-bot-api";
import { newParticipantJoin, replyToTagBot, botAddedToGroup, botRemovedFromGroup, memberLeft, messagePinned, groupRenamed } from "./HandleMessage";

export class TelegramBotService {
  private _instance: TelegramBotService;

  private webHook: string = process.env.TELEGRAM_WEB_HOOK;

  bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    this.init();
  }

  /**
   * Init webhook if not exists
   */
  async init() {
    const data = await this.bot.getWebHookInfo();

    if (!data.url) await this.setWebhook();

    if (data.url && data.url !== this.webHook) {
      await this.bot.deleteWebHook();
      await this.setWebhook();
    }
  }

  async setWebhook() {
    await this.bot.setWebHook(this.webHook, { allowed_updates: ["chat_member", "message", "edited_channel_post", "callback_query"] });
  }

  getBotService(): TelegramBotService {
    if (!this._instance) {
      this._instance = new TelegramBotService();
      this.setWebhook();
    }
    return this._instance;
  }

  async getMe() {
    const userInfo = await this.bot.getMe();
    console.log(userInfo);
  }

  onNewUpdate(message: TelegramBot.Message) {
    const botId = Number(process.env.TELEGRAM_BOT_ID);

    /**
     * Tag bot
     */
    // if (message.entities && message.entities[0]?.user === undefined) {
    //   replyToTagBot(this.bot, message);
    //   return;
    // }

    /**
     * Members added to group (includes bot being added)
     */
    if (message.new_chat_members?.length) {
      for (const member of message.new_chat_members) {
        if (member.id === botId) {
          botAddedToGroup(this.bot, message);
        } else if (!member.is_bot) {
          newParticipantJoin(this.bot, message, member);
        }
      }
      return;
    }

    /**
     * Member left or was removed from group (includes bot being removed)
     */
    if (message.left_chat_member) {
      if (message.left_chat_member.id === botId) {
        botRemovedFromGroup(this.bot, message);
      } else if (!message.left_chat_member.is_bot) {
        memberLeft(this.bot, message, message.left_chat_member);
      }
      return;
    }

    /**
     * Message pinned
     */
    if (message.pinned_message) {
      messagePinned(this.bot, message);
      return;
    }

    /**
     * Group renamed
     */
    if (message.new_chat_title) {
      groupRenamed(this.bot, message);
      return;
    }
  }

  private async sendWithRetry(chatId: number, message: string, maxRetries = 5, attempt = 0): Promise<TelegramBot.Message> {
    try {
      return await this.bot.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });
    } catch (error: unknown) {
      const err = error as { response?: { statusCode?: number; body?: string }; message?: string };
      const statusCode = err?.response?.statusCode;

      if (statusCode === 429 && attempt < maxRetries) {
        let retryAfter = 1;
        try {
          const body = JSON.parse(err?.response?.body ?? "{}");
          retryAfter = body?.parameters?.retry_after ?? 1;
        } catch {
          // ignore parse error, use default
        }
        console.warn(`[sendWithRetry] Rate limited (429). Retrying after ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return this.sendWithRetry(chatId, message, maxRetries, attempt + 1);
      }

      if (statusCode && statusCode >= 500 && attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 30000);
        console.warn(`[sendWithRetry] Server error (${statusCode}). Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendWithRetry(chatId, message, maxRetries, attempt + 1);
      }

      throw error;
    }
  }

  sendMsgToGroup(chatId: number, message: string, callback: (error: string, message: TelegramBot.Message) => void) {
    this.sendWithRetry(chatId, message)
      .then((msg) => {
        callback(null, msg);
      })
      .catch((error) => callback(error, null));
  }
}
