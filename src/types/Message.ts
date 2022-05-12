import { randomUUID } from 'crypto'
import { Channel } from './Channel'
import { Client } from './Client'

export class Message {
  id: string
  from: Client
  content: string
  date: Date
  constructor(content: string, from: Client) {
    this.id = randomUUID()
    this.content = content
    this.from = from
    this.date = new Date()
  }
}
