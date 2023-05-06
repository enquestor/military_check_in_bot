import { Chat } from "./models";
import { CommandResult } from "./models/command_result";
import { parseCheckIns } from "./utils";

export function set(chat: Chat, message: string): CommandResult {
  const checkIns = parseCheckIns(message);

  const newChat = {
    ...chat,
    checkIns,
  };

  return {
    chat: newChat,
    reply: "已重新設定簽到記錄",
  };
}

export function add(chat: Chat, message: string): CommandResult {
  const newCheckIns = parseCheckIns(message);
  const newCheckInIds = newCheckIns.map((checkIn) => checkIn.id);
  const checkInIds = chat.checkIns.map((checkIn) => checkIn.id);
  newCheckInIds.forEach((id) => {
    if (checkInIds.includes(id)) {
      throw new Error(`學號 ${id} 重複簽到`);
    }
  });

  const checkIns = [...chat.checkIns, ...newCheckIns].sort(
    (a, b) => a.id - b.id
  );
  const newChat = {
    ...chat,
    checkIns,
  };

  const newCheckInIdsString = newCheckInIds.join(", ");

  return {
    chat: newChat,
    reply: `${newCheckInIdsString} 完成簽到`,
  };
}

export function show(chat: Chat): CommandResult {
  if (chat.checkIns.length === 0) {
    throw new Error("無簽到記錄");
  }

  const checkInMessage = chat.checkIns
    .map((checkIn) => checkIn.message)
    .join("\n\n");

  return {
    reply: checkInMessage,
  };
}

export function absent(chat: Chat): CommandResult {
  if (chat.ids.length === 0) {
    throw new Error("尚未設定成員學號");
  }

  const checkInIds = chat.checkIns.map((checkIn) => checkIn.id);
  const absentIds = chat.ids.filter((id) => !checkInIds.includes(id));

  if (absentIds.length === 0) {
    return {
      reply: "全班已簽到",
    };
  } else {
    const absentIdsString = absentIds.join(", ");

    return {
      reply: `未簽到：${absentIdsString}`,
    };
  }
}

export function help(): CommandResult {
  return {
    reply:
      "指令列表：\n\n++：簽到\n==：清除/設定簽到記錄\n>>：顯示完整簽到訊息\n--：顯示未簽到成員\n@@：顯示幫助訊息",
  };
}

export function about(): CommandResult {
  return {
    reply: "關於國軍簽到機器人：\n\n作者：乳頭山 047",
  };
}

export function format(chat: Chat): CommandResult {
  if (chat.format === "") {
    throw new Error("無簽到格式");
  }

  return {
    reply: chat.format,
  };
}

export function example(chat: Chat): CommandResult {
  if (chat.example === "") {
    throw new Error("無簽到範例");
  }

  return {
    reply: chat.example,
  };
}

export function configFormat(chat: Chat, message: string): CommandResult {
  const newChat = {
    ...chat,
    format: message,
  };

  return {
    chat: newChat,
    reply: "已設定簽到格式",
  };
}

export function configExample(chat: Chat, message: string): CommandResult {
  const newChat = {
    ...chat,
    example: message,
  };

  return {
    chat: newChat,
    reply: "已設定簽到範例",
  };
}

export function configIds(chat: Chat, message: string): CommandResult {
  if (message.includes(",")) {
    const ids = message.split(",").map((id) => parseInt(id.trim()));
    const newChat = {
      ...chat,
      ids,
    };

    return {
      chat: newChat,
      reply: `已設定成員學號：${message}`,
    };
  } else if (message.includes("-")) {
    const [start, end] = message.split("-").map((id) => parseInt(id.trim()));
    const ids = [];
    for (let i = start; i <= end; i++) {
      ids.push(i);
    }
    const newChat = {
      ...chat,
      ids,
    };

    return {
      chat: newChat,
      reply: `已設定成員學號：${message}`,
    };
  } else if (message.includes("clear")) {
    const newChat = {
      ...chat,
      ids: [],
    };

    return {
      chat: newChat,
      reply: "已清除成員學號",
    };
  } else {
    throw new Error("學號格式錯誤");
  }
}
