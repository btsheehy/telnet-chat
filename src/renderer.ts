import { Channel } from './types/channel/Channel'
import { Client } from './types/client/Client'
import { KeyedStore } from './types/Store'

const takeRight = (arr: Array<any>, qty = 1) => [...arr].splice(-qty, qty)

class Canvas {
  height: number
  width: number
  content: Array<Array<string>>
  constructor(height: number, width: number) {
    this.height = height
    this.width = width
    this.content = Array(height).fill([' '.repeat(width)])
  }
  // remove all blank lines from end of canvas
  trimDataLines = (gridLines: string[]): string[] => {
    for (let i = gridLines.length - 1; i >= 0; i--) {
      if (gridLines[i].trim().length === 0) {
        gridLines.splice(i, 1)
      } else {
        break
      }
    }
    return gridLines
  }
  getDataLines = () => {
    return this.trimDataLines(this.content.map((line) => line.join('')))
  }
  writeLine = (lineIndex: number, line: string) => {
    this.content[lineIndex] = [line]
  }
  writeAndFillLine = (lineIndex: number, line: string) => {
    this.content[lineIndex] = [line + ' '.repeat(this.width - line.length)]
  }
  splitLineIntoColumns = (lineIndex: number, columnSizes: Array<number>) => {
    if (columnSizes.reduce((a, b) => a + b, 0) > this.width)
      throw new Error('Column sizes too large')
    const line = this.content[lineIndex].join('')
    this.content[lineIndex] = columnSizes.map((size) => line.substring(0, size))
  }
  writeCell = (
    lineIndex: number,
    columnIndex: number,
    content: string = ''
  ) => {
    content = content.substring(0, this.content[lineIndex][columnIndex].length)
    content = content.padEnd(this.content[lineIndex][columnIndex].length)
    this.content[lineIndex][columnIndex] = content
  }
}

export const renderChannel = (
  channel: Channel,
  channelStore: KeyedStore<Channel>,
  clientStore: KeyedStore<Client>,
  client: Client
) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  const channels = channelStore.getAll()
  const channelList = channels.map((channel) => channel.name)
  const clients = clientStore.getAll()
  const usersList = clients.map((client) => client.name)
  canvas.splitLineIntoColumns(0, [25, canvas.width - 25])
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
  return canvas.getDataLines()
}

export const renderLoginPage = (client: Client) => {
  const canvas = new Canvas(client.height - 10, client.width - 10)
  canvas.writeLine(0, 'Welcome to the chat, ' + client.name + '!')
  canvas.writeLine(1, 'Type "/help" for a list of commands')
  return canvas.getDataLines()
}
