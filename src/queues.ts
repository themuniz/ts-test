import { Queue } from 'bullmq'
import log from './logger.js'
import { env } from './index.js'

const callLogQueue = () => {
  try {
    const queue = new Queue('grizzly-logs', {
      connection: {
        host: env.REDIS_SERVER,
        port: env.REDIS_PORT,
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 30000,
        },
      },
    })
    log.info(
      `📣 Created connection to Redis server: ${process.env.REDIS_SERVER} on port ${process.env.REDIS_PORT}`,
    )
    return queue
  } catch (error) {
    if (error instanceof Error) {
      log.warn(
        `🚫 Could not open connection to Redis server: ${error.message}`,
      )
    }
  }
}

export const logQueue = callLogQueue()
