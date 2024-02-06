import { Queue } from 'bullmq'
import 'dotenv/config'

const callLogQueue = () => {
    try {
        const queue = new Queue('grizzly-logs', {
            // Normally, we would load from env (post-Zod), but this is run before we do zod validation
            connection: {
                host: process.env.REDIS_SERVER,
                port: Number(process.env.REDIS_PORT),
            },
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 30000,
                },
            },
        })
        console.log(
            `📣 Created connection to Redis server: ${process.env.REDIS_SERVER} on port ${process.env.REDIS_PORT}`,
        )
        return queue
    } catch (error) {
        if (error instanceof Error) {
            console.error(
                `🚫 Could not open connection to Redis server: ${error.message}`,
            )
        }
    }
}

export const logQueue = callLogQueue()
