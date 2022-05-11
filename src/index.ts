import net from 'net'
import { Channel } from './types/channel/Channel'
import { KeyedStore } from './types/Store'
import { Client } from './types/client/Client'

export const clientStore = new KeyedStore<Client>()
export const channelStore = new KeyedStore<Channel>()

const server = net.createServer((socket) => {
  clientStore.add(new Client(socket))
})

server.listen(23, () => {
  console.log('server listening')
  console.log(server.address())
})
