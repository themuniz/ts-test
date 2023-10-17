import express from 'express'
import { z } from 'zod'
import 'dotenv/config'
import nunjucks from 'nunjucks'
import log from './logger.js'
import sql from 'mssql'
import { PersonRouter } from './person_routes.js'

const app = express()

// Config schema
const envVariables = z.object({
  NODE_ENV: z.enum(['production', 'development', 'testing']),
  PORT: z.coerce.number(),
  DB_DATABASE: z.string(),
  DB_SERVER: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  REDIS_SERVER: z.string(),
  REDIS_PORT: z.coerce.number(),
})
export const env = envVariables.parse(process.env)
log.info('Processed configuration from envirnoment variables')
log.debug(`${JSON.stringify(env)}`)

// Express configs and middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('assets'))

// Templating
nunjucks.configure('views', {
  express: app,
  noCache: env.NODE_ENV === 'production' ? false : true,
})

// Routes
app.use('/person', PersonRouter)

// Server startup
// We attempt to connect to the DB pool, store the pool in the app's locals, and then use that *single* pool throughout the life-cycle of the app

// DB config
const dbConfig = {
  database: env.DB_DATABASE,
  server: env.DB_SERVER,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  pool: {
    min: 0,
    max: 10,
  },
  options: {
    trustServerCertificate: true,
  },
}
// TODO: refactor this into a proper function
const { ConnectionPool } = sql
const appPool = new ConnectionPool(dbConfig)
appPool
  .connect()
  .then(function(pool) {
    app.locals.db = pool
    log.info(`Connected to database ${env.DB_DATABASE}@${env.DB_SERVER}`)
    app.listen(env.PORT, () => {
      log.info(`Server started on port ${env.PORT}`)
    })
  })
  .catch(function(err) {
    if (err.name === 'ConnectionError') {
      log.error(`Error connecting to database: ${err}`)
    } else {
      log.error(`Error starting server on port ${env.PORT}, ${err}`)
    }
  })
