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
    await this.bot.setWebHook(this.webHook, { allowed_updates: ["chat_member", "my_chat_member", "message", "edited_channel_post", "callback_query"] });
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

  onChatMemberUpdate(update: TelegramBot.ChatMemberUpdated) {
    const botId = Number(process.env.TELEGRAM_BOT_ID);
    const { chat, new_chat_member, old_chat_member } = update;

    console.log("[onChatMemberUpdate]", chat.title, new_chat_member.user.username, old_chat_member.status, "->", new_chat_member.status);

    const wasNotMember = ["left", "kicked", "restricted"].includes(old_chat_member.status);
    const isNowMember = ["member", "administrator", "creator"].includes(new_chat_member.status);
    const isNowLeft = ["left", "kicked"].includes(new_chat_member.status);

    if (new_chat_member.user.id === botId) {
      // Bot itself joined/left
      if (isNowMember) {
        console.log(`[onChatMemberUpdate] Bot added to group [${chat.id}] ${chat.title}`);
      } else if (isNowLeft) {
        console.log(`[onChatMemberUpdate] Bot removed from group [${chat.id}] ${chat.title}`);
      }
      return;
    }

    if (!new_chat_member.user.is_bot && wasNotMember && isNowMember) {
      console.log(`[onChatMemberUpdate] New member joined [${chat.id}] ${chat.title}: ${new_chat_member.user.first_name}`);
    }
  }

  sendMsgToGroup(chatId: number, message: string, callback: (error: string, message: TelegramBot.Message) => void) {
    this.sendWithRetry(chatId, message)
      .then((msg) => {
        callback(null, msg);
      })
      .catch((error) => callback(error, null));
  }

  async getUpdates(offset?: number): Promise<TelegramBot.Update[]> {
    const updates = await this.bot.getUpdates({ offset, allowed_updates: ["message", "my_chat_member"] });

    console.log("[getUpdates] Received updates:", updates.length);
    console.log("[getUpdates] Updates:", JSON.stringify(updates, null, 2));

    const newGroups = updates.filter((u) => {
      if (u.my_chat_member) {
        const { new_chat_member, chat } = u.my_chat_member;
        const isGroup = chat.type === "group" || chat.type === "supergroup";
        const botAdded = new_chat_member.status === "member" || new_chat_member.status === "administrator";
        return isGroup && botAdded;
      }
      return false;
    });

    if (newGroups.length) {
      console.log(`[getUpdates] Found ${newGroups.length} new group(s):`);
      for (const u of newGroups) {
        const chat = u.my_chat_member.chat;
        console.log(`  - [${chat.id}] ${chat.title} (${chat.type})`);
      }
    } else {
      console.log("[getUpdates] No new groups found.");
    }

    return updates;
  }
}
