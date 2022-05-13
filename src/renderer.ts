import { Channel } from './types/Channel'
import { Client } from './types/Client'
import { KeyedStore } from './types/Store'
import { Canvas } from './types/Canvas'

const takeRight = (arr: Array<any>, qty = 1) => [...arr].splice(-qty, qty)

export const renderChannel = (
  channel: Channel,
  channelStore: KeyedStore<Channel>,
  client: Client
) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  const channels = channelStore.getAll()
  const channelList = channels.map((channel) => channel.name)
  canvas.splitLineIntoColumns(0, [40, canvas.width - 40])
  canvas.writeCell(0, 0, `Logged in as: ${client.name}`)
  canvas.writeCell(0, 1, `Viewing channel: ${channel.name}`)
  canvas.writeLine(1, '-'.repeat(canvas.width))
  // leaving room at the top for the header and the bottom for the input
  const mainAreaStart = 2
  const mainAreaEnd = canvas.height - 4
  for (let i = mainAreaStart; i < mainAreaEnd; i++) {
    canvas.splitLineIntoColumns(i, [25, 3, canvas.width - 56, 3, 25])
    canvas.writeCell(i, 1, '|')
    canvas.writeCell(i, 3, '|')
  }
  canvas.writeCell(mainAreaStart, 0, 'Channels:')
  const channelsInMainArea = channelList.splice(
    0,
    mainAreaEnd - mainAreaStart - 1
  )
  channelsInMainArea.forEach((channel, i) => {
    canvas.writeCell(mainAreaStart + i + 1, 0, channel)
  })

  canvas.writeCell(mainAreaStart, 4, 'Active Users Here:')
  const activeUsersInMainArea = channel.clients
    .map((c) => c.name)
    .splice(0, mainAreaEnd - mainAreaStart - 1)
  activeUsersInMainArea.forEach((client, i) => {
    canvas.writeCell(mainAreaStart + i + 1, 4, client)
  })

  const messageLines = channel.messages
    .map((message) => {
      return [
        message.from.name,
        '-'.repeat(message.from.name.length),
        message.date.toDateString() + ' ' + message.date.toLocaleTimeString(),
        message.content,
        '-'.repeat(canvas.width),
      ]
    })
    .flat()
  // get lines that fit in the main area
  const messageLinesInMainArea = takeRight(
    messageLines,
    mainAreaEnd - mainAreaStart
  )
  messageLinesInMainArea.forEach((line, i) => {
    canvas.writeCell(mainAreaStart + i, 2, line)
  })
  return canvas.getDataLines()
}

export const renderHelpPage = (client: Client) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  const helpMessageLines = [
    '*'.repeat(canvas.width),
    ' HELP',
    ' Available commands:',
    '',
    '  /help - displays this help page',
    '  /login <username> - logs in as the given username',
    '  /logout - logs out',
    '  /join <channel name> - joins the channel with the given name. If the channel does not exist, it will be created',
    '  /rename <new username> - changes your username to the given one',
    '  /leave - leaves the current channel',
    '  /channels - lists all channels',
    '  /users - lists all users',
    '*'.repeat(canvas.width),
  ]
  helpMessageLines.forEach((h, i) => {
    canvas.splitLineIntoColumns(i, [2, 120, 2])
    canvas.writeCell(i, 0, '/*')
    canvas.writeCell(i, 1, h)
    canvas.writeCell(i, 2, '*/')
  })
  return canvas.getDataLines()
}

export const renderChannelList = (
  client: Client,
  channelStore: KeyedStore<Channel>
) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  const channels = channelStore.getAll()
  canvas.writeLine(0, 'Available channels:')
  if (channels.length === 0) {
    canvas.writeLine(
      1,
      'No channels available yet. Create the first one! Type "/join <channel name>"'
    )
  }
  channels.forEach((c, i) => {
    canvas.writeLine(i + 1, c.name)
  })
  return canvas.getDataLines()
}

export const renderUserList = (
  client: Client,
  clientStore: KeyedStore<Client>
) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  const clients = clientStore.getAll()
  canvas.writeLine(0, 'Available users:')
  clients.forEach((c, i) => {
    canvas.writeLine(i + 1, c.name)
  })
  return canvas.getDataLines()
}

export const renderHomePage = (client: Client) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  const welcomeAscii =
    "\r\n __    __     _                            _        \r\n/ / /\\ \\ \\___| | ___ ___  _ __ ___   ___  | |_ ___  \r\n\\ \\/  \\/ / _ \\ |/ __/ _ \\| '_ ` _ \\ / _ \\ | __/ _ \\ \r\n \\  /\\  /  __/ | (_| (_) | | | | | |  __/ | || (_) |\r\n  \\/  \\/ \\___|_|\\___\\___/|_| |_| |_|\\___|  \\__\\___/ \r\n                                                    \r\n _____     _            _       ___ _           _   \r\n/__   \\___| |_ __   ___| |_    / __\\ |__   __ _| |_ \r\n  / /\\/ _ \\ | '_ \\ / _ \\ __|  / /  | '_ \\ / _` | __|\r\n / / |  __/ | | | |  __/ |_  / /___| | | | (_| | |_ \r\n \\/   \\___|_|_| |_|\\___|\\__| \\____/|_| |_|\\__,_|\\__|\r\n                                                    "
  canvas.writeLine(0, welcomeAscii)
  if (!client.name) {
    canvas.writeLine(7, 'Type "/login <username>" to log in')
  }
  return canvas.getDataLines()
}

export const renderLoginPage = (client: Client) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  canvas.writeLine(0, 'Welcome to the chat, ' + client.name + '!')
  canvas.writeLine(1, 'Type "/help" for a list of commands')
  return canvas.getDataLines()
}
