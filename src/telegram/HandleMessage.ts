import TelegramBot from "node-telegram-bot-api";

function replyToTagBot(bot: TelegramBot, message: TelegramBot.Message) {
  const userName = `[@${message.from.first_name}](tg://user?id=${message.from.id})`;
  bot.sendMessage(message.chat.id, `Hi ${userName}, what do you need support?`, {
    parse_mode: "Markdown",
  });
}

function newParticipantJoin(bot: TelegramBot, message: TelegramBot.Message, member: TelegramBot.User) {
  const userName = `[@${member.first_name}](tg://user?id=${member.id})`;
  console.log(`[newParticipantJoin] ${member.first_name} (${member.id}) joined ${message.chat.title} (${message.chat.id})`);
  // bot.sendMessage(message.chat.id, `Hello ${userName}! Welcome to the ${message.chat.title} telegram group!`, {
  //   parse_mode: "Markdown",
  // });
}

function botAddedToGroup(bot: TelegramBot, message: TelegramBot.Message) {
  const userName = `[${message.from.first_name}](tg://user?id=${message.from.id})`;
  bot.sendMessage(process.env.OWNER_BOT_ID, `*I had join new group*\n- Group name: ${message.chat.title}\n- Group id: ${message.chat.id}\n- Added by: ${userName}`, {
    parse_mode: "Markdown",
  });
}

function botRemovedFromGroup(bot: TelegramBot, message: TelegramBot.Message) {
  const userName = `[${message.from.first_name}](tg://user?id=${message.from.id})`;
  bot.sendMessage(process.env.OWNER_BOT_ID, `*I was removed from a group*\n- Group name: ${message.chat.title}\n- Group id: ${message.chat.id}\n- Removed by: ${userName}`, {
    parse_mode: "Markdown",
  });
}

function memberLeft(bot: TelegramBot, message: TelegramBot.Message, member: TelegramBot.User) {
  const userName = `[@${member.first_name}](tg://user?id=${member.id})`;
  console.log(`[memberLeft] ${member.first_name} (${member.id}) left ${message.chat.title} (${message.chat.id})`);
  // bot.sendMessage(message.chat.id, `${userName} has left the group.`, {
  //   parse_mode: "Markdown",
  // });
}

function messagePinned(bot: TelegramBot, message: TelegramBot.Message) {
  const pinnedBy = `[@${message.from.first_name}](tg://user?id=${message.from.id})`;
  console.log(`[messagePinned] ${message.from.first_name} pinned a message in ${message.chat.title} (${message.chat.id})`);
  // bot.sendMessage(message.chat.id, `📌 ${pinnedBy} pinned a message.`, {
  //   parse_mode: "Markdown",
  // });
}

function groupRenamed(bot: TelegramBot, message: TelegramBot.Message) {
  const renamedBy = `[@${message.from.first_name}](tg://user?id=${message.from.id})`;
  console.log(`[groupRenamed] ${message.from.first_name} renamed ${message.chat.title} to "${message.new_chat_title}" (${message.chat.id})`);
  // bot.sendMessage(message.chat.id, `✏️ ${renamedBy} renamed the group to *${message.new_chat_title}*`, {
  //   parse_mode: "Markdown",
  // });
}

/** @deprecated use botAddedToGroup / botRemovedFromGroup instead */
function sendToBotOwner(bot: TelegramBot, message: TelegramBot.Message) {
  botAddedToGroup(bot, message);
}

export { replyToTagBot, newParticipantJoin, botAddedToGroup, botRemovedFromGroup, memberLeft, messagePinned, groupRenamed, sendToBotOwner };
