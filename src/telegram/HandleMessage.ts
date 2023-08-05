import TelegramBot from "node-telegram-bot-api";

function replyToTagBot(bot: TelegramBot, message: TelegramBot.Message) {
  const userName = `[@${message.from.first_name}](tg://user?id=${message.from.id})`;
  bot.sendMessage(message.chat.id, `Hi ${userName}, what do you need support?`, {
    parse_mode: "Markdown",
  });
}

function newParticipantJoin(bot: TelegramBot, message: TelegramBot.Message) {
  // @ts-ignore
  const userName = `[@${message.new_chat_participant.first_name}](tg://user?id=${message.new_chat_participant.id})`;
  bot.sendMessage(message.chat.id, `Hello ${userName}! Welcome to the ${message.chat.title} telegram group!`, {
    parse_mode: "Markdown",
  });
}

function sendToBotOwner(bot: TelegramBot, message: TelegramBot.Message) {
  // @ts-ignore
  const userName = `[${message.from.first_name}](tg://user?id=${message.from.id})`;
  bot.sendMessage(
    process.env.OWNER_BOT_ID,
    `*I had join new group*\n
    - Group name: ${message.chat.title}\n- Group id: ${message.chat.id}\n- Added by: ${userName}`,
    {
      parse_mode: "Markdown",
    }
  );
}

export { replyToTagBot, newParticipantJoin, sendToBotOwner };
