import net from 'net'
import 'dotenv/config'
import { Channel } from './types/Channel'
import { KeyedStore } from './types/Store'
import { Client } from './types/Client'
import { Logger } from './logger'

export const clientStore = new KeyedStore<Client>()
export const channelStore = new KeyedStore<Channel>()
const sampleChannels: string[] = [
  'general',
  'random',
  'engineers',
  'designers',
  'dallas-office',
  'lunch-plans',
]
sampleChannels.forEach((name: string) => {
  channelStore.add(new Channel(name, 'public'))
})

const logger = new Logger(process.env.LOG_FILE_LOCATION, {
  application: 'telnet-chat',
  environment: process.env.ENVIRONMENT,
})

const server = net.createServer((socket) => {
  clientStore.add(new Client(socket, logger))
})

const port = process.env.PORT || 23
server.listen(port, () => {
  logger.info('server listening', { address: server.address() })
})
