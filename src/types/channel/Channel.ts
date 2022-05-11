import { randomUUID } from 'crypto'
import { Client } from '../client/Client'
import { Message } from '../message/Message'
import EventEmitter from 'events'
import { clientStore } from '../../index'

type ChannelType = 'public' | 'private'

export class Channel {
  name: string
  id: string
  type: ChannelType
  clients: Client[]
  messages: Message[]
  eventEmitter: EventEmitter
  constructor(name: string, type: ChannelType) {
    this.name = name
    this.id = randomUUID()
    this.type = type
    this.clients = []
    this.messages = []
    this.eventEmitter = new EventEmitter()
    clientStore.eventEmitter.on(
      'channel membership changed',
      this.handleMembershipChange
    )
  }
  handleMembershipChange = () => {
    console.log('channel membership changed')
    const clients = clientStore.getAll()
    console.log({ clients })
    console.log(clients.map((c) => c.uiContext.channel?.id))
    this.clients = clientStore
      .getAll()
      .filter((client) => client.uiContext.channel?.id === this.id)
  }
  addMessage = (message: Message) => {
    this.messages.push(message)
    this.eventEmitter.emit('new message', message)
  }
}
