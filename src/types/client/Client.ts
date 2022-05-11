import { Socket } from 'net'
import { randomUUID } from 'crypto'
import { Channel } from '../channel/Channel'
import { Message } from '../message/Message'
import { helpMessage, separator } from '../../presetMessages'
import { channelStore, clientStore } from '../../index'
import {
  renderHelpPage,
  renderChannel,
  renderChannelList,
  renderUserList,
  renderHomePage,
  renderLoginPage,
} from '../../renderer'

type ForegroundColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'default'
type BackgroundColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'default'

type Style = 'bold' | 'italic' | 'underline' | 'blink' | 'invert' | 'hidden'
const foregroundColorMap: { [key in ForegroundColor as string]: number } = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  default: 39,
}
const backgroundColorMap: { [key in BackgroundColor as string]: number } = {
  black: 40,
  red: 41,
  green: 42,
  yellow: 43,
  blue: 44,
  magenta: 45,
  cyan: 46,
  white: 47,
  default: 49,
}
const styleMap: { [key in Style as string]: number } = {
  bold: 1,
  italic: 3,
  underline: 4,
  blink: 5,
  invert: 7,
  hidden: 8,
}

type TelnetCommand =
  | 'IAC'
  | 'DONT'
  | 'DO'
  | 'WONT'
  | 'WILL'
  | 'SB'
  | 'GA'
  | 'EL'
  | 'EC'
  | 'AYT'
  | 'AO'
  | 'IP'
  | 'BREAK'
  | 'DM'
  | 'NOP'
  | 'SE'
  | 'EOR'
  | 'ABORT'
  | 'SUSP'
  | 'EOF'
  | 'SYNCH'

const telnetCommands: { [key in TelnetCommand as string]: number } = {
  IAC: 255, // interpret as command
  DONT: 254, // you are not to use option
  DO: 253, // please use option
  WONT: 252, // I won't use option
  WILL: 251, // I will use option
  SB: 250, // sub-negotiation
  GA: 249, // Go-ahead
  EL: 248, // Erase line
  EC: 247, // Erase character
  AYT: 246, // Are you there?
  AO: 245, // Abort output (but let prog finish)
  IP: 244, // Interrupt (permanently)
  BREAK: 243,
  DM: 242, // Data mark
  NOP: 241,
  SE: 240, // End sub-negotiation
  EOR: 239, // End of record (transparent mode)
  ABORT: 238, // Abort process
  SUSP: 237, // Suspend process
  EOF: 236, // End of file
  SYNCH: 242,
}
type TelnetOption =
  | 'OPT_BINARY'
  | 'OPT_ECHO'
  | 'OPT_SUPPRESS_GO_AHEAD'
  | 'OPT_STATUS'
  | 'OPT_TIMING_MARK'
  | 'OPT_TTYPE'
  | 'OPT_WINDOW_SIZE'
  | 'OPT_LINE_MODE'
  | 'OPT_NEW_ENVIRON'
  | 'OPT_COMPRESS2'
  | 'TELQUAL_IS'
  | 'TELQUAL_SEND'
const telnetOptions: { [key in TelnetOption as string]: number } = {
  OPT_BINARY: 0, // RFC 856
  OPT_ECHO: 1, // RFC 857
  OPT_SUPPRESS_GO_AHEAD: 3, // RFC 858
  OPT_STATUS: 5, // RFC 859
  OPT_TIMING_MARK: 6, // RFC 860
  OPT_TTYPE: 24, // RFC 930, 1091
  OPT_WINDOW_SIZE: 31, // RFC 1073
  OPT_LINE_MODE: 34, // RFC 1184
  OPT_NEW_ENVIRON: 39, // RFC 1572
  OPT_COMPRESS2: 86, // http://www.zuggsoft.com/zmud/mcp.htm
  TELQUAL_IS: 0,
  TELQUAL_SEND: 1,
}
const commandsFlipped: { [key: number]: string } = Object.entries(
  telnetCommands
).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {})
const optionsFlipped: { [key: number]: string } = Object.entries(
  telnetOptions
).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {})

type UIContext =
  | {
      screen: 'channel'
      channel: Channel
    }
  | {
      screen: 'help'
      channel?: null
    }
  | {
      screen: 'channelList'
      channel?: null
    }
  | {
      screen: 'usersList'
      channel?: null
    }
  | {
      screen: 'home'
      channel?: null
    }
  | {
      screen: 'login'
      channel?: null
    }

export class Client {
  socket: Socket
  id: string
  name: string
  uiContext: UIContext
  width: number
  height: number

  constructor(socket: Socket) {
    this.socket = socket
    this.id = randomUUID()
    // this.socket.on('ready', this.clearScreen)
    this.socket.on('data', this.takeInput)
    this.uiContext = { screen: 'home' }
    this.width = 200
    this.height = 80
    this.clearScreen()
    this.navigate({ screen: 'home' })
    clientStore.eventEmitter.on('change', () => {
      console.log('clientStore changed')
      this.refresh()
    })
    channelStore.eventEmitter.on('change', () => {
      console.log('channelStore changed')
      this.refresh()
    })
  }
  clearScreen = () => {
    this.socket.write('\x1b[2J\x1b[0;0H')
  }
  clearLine = () => {
    this.socket.write('\x1b[2K')
  }
  moveCursorUp = (n: number) => {
    this.socket.write(`\x1b[${n}A`)
  }
  saveScreen = () => {
    this.socket.write('\x1b[?47h')
  }
  restoreScreen = () => {
    this.socket.write('\x1b[?47l')
  }
  saveCursor = () => {
    this.socket.write('\x1b 7')
  }
  restoreCursor = () => {
    this.socket.write('\x1b 8')
  }
  handleWindowSizeChange = (width: number, height: number) => {
    this.width = width
    this.height = height
  }
  navigate = (uiContext: UIContext) => {
    const oldUiContext = this.uiContext
    this.uiContext = uiContext
    if (uiContext.channel !== oldUiContext.channel) {
      oldUiContext.channel?.eventEmitter.removeListener(
        'new message',
        this.refresh
      )
      this.uiContext.channel?.eventEmitter.on('new message', this.refresh)
      clientStore.eventEmitter.emit('channel membership changed')
      clientStore.eventEmitter.emit('change')
    }
    let newContent
    switch (uiContext.screen) {
      case 'channel':
        newContent = renderChannel(
          this.uiContext.channel,
          channelStore,
          clientStore,
          this
        )
        break
      case 'help':
        newContent = renderHelpPage(this)
        break
      case 'channelList':
        newContent = renderChannelList(this, channelStore)
        break
      case 'usersList':
        newContent = renderUserList(this, clientStore)
        break
      case 'login':
        newContent = renderLoginPage(this)
        break
      default:
        newContent = renderHomePage(this)
        break
    }
    this.clearScreen()
    newContent.forEach((l) => this.sendData(l))
  }
  refresh = () => {
    console.log('refresh')
    if (this.uiContext.screen === 'channel') {
      this.clearScreen()
      renderChannel(
        this.uiContext.channel,
        channelStore,
        clientStore,
        this
      ).forEach((l) => this.sendData(l))
    }
  }
  sendData = (
    message: string,
    foregroundColor?: ForegroundColor,
    backgroundColor?: BackgroundColor,
    style?: Style
  ) => {
    const fg = foregroundColor ? foregroundColorMap[foregroundColor] + ';' : ''
    const bg = backgroundColor ? backgroundColorMap[backgroundColor] + ';' : ''
    const s = style ? styleMap[style] + ';' : ''
    this.socket.write(`\x1b[${fg}${bg}${s}m${message}\x1b[0m\n`)
  }
  runCommand = (command: string) => {
    console.log('runCommand')
    console.log({ command })
    const [commandName, ...args] = command.split(' ')
    switch (commandName.replace(/\//, '')) {
      case 'help':
        this.navigate({ screen: 'help' })
        break
      case 'login':
        this.login(args[0])
        break
      case 'logout':
        this.logout()
        break
      case 'rename':
        this.rename(args[0])
        break
      case 'join':
        this.join(args[0])
        break
      case 'leave':
        this.leave()
        break
      case 'channels':
        this.navigate({ screen: 'channelList' })
        break
      case 'debug':
        this.debug()
        break
      case 'users':
        this.navigate({ screen: 'usersList' })
        break
      default:
        this.sendData(`Unknown command: ${commandName}`)
        break
    }
  }
  takeTelnetCommands = (input: Buffer) => {
    console.log('takeTelnetCommands')
    let i = 0
    while (i < input.length) {
      if (input[i] in commandsFlipped) {
        console.log(commandsFlipped[input[i]])
      } else if (input[i] in optionsFlipped) {
        console.log(optionsFlipped[input[i]])
      }
      i++
    }

    const commands: string[] = []
    input.forEach((c) => {
      if (c in commandsFlipped) {
        commands.push(commandsFlipped[c])
      } else if (c in optionsFlipped) {
        commands.push(optionsFlipped[c])
      }
    })
    console.log({ commands })

    if (input.includes(telnetCommands.SB)) {
      // contains subnegotiation
      const start = input.indexOf(telnetCommands.SB)
      const end = input.lastIndexOf(telnetCommands.SE)
      const subnegotiation = input.slice(start, end + 1)
      const subnegotiationType = subnegotiation[1]
      // we only really care about screen resizing, so we'll just ignore everything else
      if (subnegotiationType === telnetOptions.OPT_WINDOW_SIZE) {
        const width = subnegotiation.readInt16BE(2)
        const height = subnegotiation.readInt16BE(4)
        console.log({ width, height })
        this.handleWindowSizeChange(width, height)
      }
    }
  }
  sendTelnetCommand = (command: TelnetCommand, option: TelnetOption) => {
    const commandCode = telnetCommands[command]
    const optionCode = telnetOptions[option]
    console.log('sendTelnetCommand')
    console.log({ command })
    const commandBuffer = Buffer.alloc(3)
    commandBuffer[0] = telnetCommands.IAC
    commandBuffer[1] = commandCode
    commandBuffer[2] = optionCode
    this.socket.write(commandBuffer)
  }
  takeInput = (data: any) => {
    const isTelnetCommand = data[0] === 255
    if (isTelnetCommand) return this.takeTelnetCommands(data)
    const input = data.toString().trimEnd()
    if (!input) {
      this.moveCursorUp(1)
      this.clearLine()
      return
    }
    if (
      !this.name &&
      !input.startsWith('/login ') &&
      !input.startsWith('/help')
    ) {
      return this.sendData('Please login by typing "/login <username>"')
    }
    console.log(input)
    const isCommand = input.startsWith('/')
    if (isCommand) return this.runCommand(input)
    else if (this.uiContext.channel) {
      this.moveCursorUp(1)
      this.clearLine()
      this.uiContext.channel.addMessage(new Message(input, this))
    }
  }
  login = (username: string) => {
    this.name = username
    clientStore.eventEmitter.emit('change')
    this.sendData(`Welcome to the chat, ${username}!`)
    this.sendData('Type "/help" for a list of commands')
    this.sendTelnetCommand('DO', 'OPT_WINDOW_SIZE')
  }
  logout = () => {
    this.clearScreen()
    this.name = null
    this.sendData('You have been logged out.')
  }
  rename = (newUsername: string) => {
    this.name = newUsername
    clientStore.eventEmitter.emit('change')
    this.sendData(`Your username has been changed to ${newUsername}.`)
  }
  join = (channelName: string) => {
    const channel = channelStore.getByName(channelName)
    if (!channel) {
      const newChannel = new Channel(channelName, 'public')
      channelStore.add(newChannel)
      this.navigate({ screen: 'channel', channel: newChannel })
      this.sendData(`Channel ${channelName} created.`)
    } else {
      this.navigate({ screen: 'channel', channel })
    }
    this.sendData(`You have joined ${channelName}.`)
    // this.renderChannel()
  }
  leave = () => {
    this.navigate({ screen: 'home' })
  }

  debug = () => {
    console.log({
      channels: channelStore
        .getAll()
        .map((c) => ({ ...c, clients: c.clients.map((c) => c.name) })),
      clients: clientStore.getAll().map((c) => ({
        ...c,
        uiContext: `${c.uiContext.screen}/${c.uiContext.channel?.name}`,
      })),
    })
  }
}
