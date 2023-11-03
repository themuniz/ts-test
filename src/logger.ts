import winston from 'winston'
import Transport from 'winston-transport'

class GrizzlyTransport extends Transport {
  constructor(opts: object) {
    super(opts)
  }
  log(info: unknown, callback: () => void) {
    // TODO: add message to queue
    console.log(JSON.stringify(info, null, 2))
    callback()
  }
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isProduction = env === 'production'
  return isProduction ? 'info' : 'debug'
}

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ level: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
  ),
)

const transports = [
  new winston.transports.Console({
    format: format,
  }),
  new GrizzlyTransport({
    level: level(),
    format: winston.format.combine(
      winston.format.json(),
      winston.format.metadata(),
      winston.format.uncolorize(),
    ),
  }),
]

const Logger = winston.createLogger({
  level: level(),
  levels,
  defaultMeta: { server: 'grizzly-ts', node_env: process.env.NODE_ENV},
  format,
  transports,
})

export default Logger
