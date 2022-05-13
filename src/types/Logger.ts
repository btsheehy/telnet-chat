import fs from 'fs'

type genericObject = { [key: string]: any }

export class Logger {
  private logFileLocation: string = null
  defaultContext: { [key: string]: any } = { level: 'INFO' }
  private logFileStream: fs.WriteStream = null
  constructor(logFileLocation: string, defaultContext: { [key: string]: any }) {
    this.logFileLocation = logFileLocation
    this.defaultContext = defaultContext
    this.logFileStream = fs.createWriteStream(this.logFileLocation, {
      flags: 'a',
    })
  }
  replaceContext = (context: { [key: string]: any }) => {
    this.defaultContext = context
  }
  addToContext = (context: { [key: string]: any }) => {
    this.defaultContext = { ...this.defaultContext, ...context }
  }
  write = (message: string, context: genericObject = {}) => {
    const d = new Date()
    const log = {
      message,
      timestamp: d.toISOString(),
      ...context,
      ...this.defaultContext,
    }
    const logMessage = JSON.stringify(log)
    this.logFileStream.write(logMessage + '\n')
    console.log(log)
  }
  debug = (message: string, context: genericObject) => {
    this.write(message, { level: 'DEBUG', ...context })
  }
  info = (message: string, context: genericObject) => {
    this.write(message, { level: 'INFO', ...context })
  }
  warn = (message: string, context: genericObject) => {
    this.write(message, { level: 'WARN', ...context })
  }
  error = (message: string, context: genericObject) => {
    this.write(message, { level: 'ERROR', ...context })
  }
  extend = (context: genericObject) => {
    return new Logger(this.logFileLocation, {
      ...this.defaultContext,
      ...context,
    })
  }
}
