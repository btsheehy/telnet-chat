import EventEmitter from 'events'

interface KeyedStoreItem {
  id: string
  name: string
}

export class KeyedStore<T extends KeyedStoreItem> {
  private state: { [key: string]: T }
  private nameToIdMap: { [key: string]: string }
  eventEmitter = new EventEmitter()
  constructor() {
    this.state = {}
    this.nameToIdMap = {}
  }
  get = (id: string) => this.state[id]
  getByName = (name: string) => this.state[this.nameToIdMap[name]]
  getAll = () => Object.values(this.state)
  rename = (oldName: string, newName: string) => {
    const id = this.nameToIdMap[oldName]
    delete this.nameToIdMap[oldName]
    this.nameToIdMap[newName] = id
    this.state[id].name = newName
    this.eventEmitter.emit('rename', oldName, newName)
    this.eventEmitter.emit('change')
  }
  add = (item: T) => {
    this.state[item.id] = item
    this.nameToIdMap[item.name] = item.id
    this.eventEmitter.emit('new item', item)
    this.eventEmitter.emit('change')
    return this.get(item.id)
  }
}
