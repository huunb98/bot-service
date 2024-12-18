import TelegramBot from "node-telegram-bot-api";
import { newParticipantJoin, replyToTagBot, sendToBotOwner } from "./HandleMessage";

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
    /**
     * Tag bot
     */
    if (message.entities && message.entities[0]?.user === undefined) {
      replyToTagBot(this.bot, message);
      return;
    }

    /**
     * New User Join
     */

    // @ts-ignore
    if (message?.new_chat_participant && message?.new_chat_participant?.is_bot === false) {
      newParticipantJoin(this.bot, message);
      return;
    }

    /**
     * Add bot to new group
     * Send message to admin
     */
    // @ts-ignore
    if (message?.group_chat_created || (message?.new_chat_participant && message?.new_chat_participant.id == process.env.TELEGRAM_BOT_ID)) {
      sendToBotOwner(this.bot, message);
      return;
    }
  }

  sendMsgToGroup(chatId: number, message: string, callback: (error: string, message: TelegramBot.Message) => void) {
    this.bot
      .sendMessage(chatId, message, {
        parse_mode: "Markdown",
      })
      .then((message) => {
        console.log(message);
        callback(null, message);
      })
      .catch((error) => callback(error, null));
  }
}
