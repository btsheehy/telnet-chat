import { randomUUID } from 'crypto'
import { Client } from '../client/Client'

export class User {
  name: string
  id: string
  clients: Client[]
  constructor(name: string) {
    this.name = name
    this.id = randomUUID()
  }
}
