import net from 'net'
import 'dotenv/config'
import { Channel } from './types/Channel'
import { KeyedStore } from './types/Store'
import { Client } from './types/Client'
import { Logger } from './logger'

export const clientStore = new KeyedStore<Client>()
export const channelStore = new KeyedStore<Channel>()
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
