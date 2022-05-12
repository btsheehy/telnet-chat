import { randomUUID } from 'crypto'
import { Client } from './Client'
import { Message } from './Message'
import EventEmitter from 'events'
import { clientStore } from '../index'

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
    const clients = clientStore.getAll()
    this.clients = clientStore
      .getAll()
      .filter((client) => client.uiContext.channel?.id === this.id)
  }
  addMessage = (message: Message) => {
    this.messages.push(message)
    this.eventEmitter.emit('new message', message)
  }
}
