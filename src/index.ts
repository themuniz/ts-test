import express, { Request, Response } from 'express'
import { z } from 'zod'
import 'dotenv/config'
import * as sql from 'mssql'
import nunjucks from 'nunjucks'
import * as gravatar from 'gravatar'
import log from './logger'

const app = express()

// Config type
const envVariables = z.object({
  NODE_ENV: z.enum(['production', 'development', 'testing']),
  PORT: z.coerce.number(),
  DB_DATABASE: z.string(),
  DB_SERVER: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
})
const env = envVariables.parse(process.env)
log.info('Processed configuration from envirnoment variables')

// Express configs and middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('assets'))

// Templating
nunjucks.configure('views', {
  express: app,
  noCache: env.NODE_ENV === 'production' ? false : true,
})

// DB
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

// Search type
const PersonSearchMetadata = z.object({
  page: z.number().default(1),
  offset: z.number().default(0),
  limit: z.number().default(10),
  reachedEnd: z.boolean().default(false),
  searchTerm: z.string().default(''),
  partialRender: z.boolean().default(false),
  recordCount: z.number().default(0),
})

type PersonSearchMetadata = z.infer<typeof PersonSearchMetadata>

// Routes
app.get('/', async (req: Request, res: Response) => {
  await sql.connect(dbConfig)
  log.info(`Database connection successful: ${env.DB_DATABASE}@${env.DB_SERVER}`)
  const metadata: PersonSearchMetadata = {
    page: 1,
    offset: 0,
    limit: 10,
    reachedEnd: false,
    searchTerm: '',
    partialRender: false,
    recordCount: 0,
  }
  log.debug(`Req query: ${JSON.stringify(req.query)}`)
  log.debug(`Req params: ${JSON.stringify(req.params)}`)
  log.debug(`Req body: ${JSON.stringify(req.body)}`)
  // TODO: move to validation stage
  if (req.query.page) {
    const pageAsString = String(req.query.page)
    metadata.page = parseInt(pageAsString)
  }
  if (req.query.limit) {
    const limitAsString = String(req.query.limit)
    metadata.limit = parseInt(limitAsString)
  }
  if (req.query.search) {
    metadata.searchTerm = String(req.query.search)
  }
  if (metadata.page > 1) {
    metadata.offset = metadata.page * metadata.limit - metadata.limit
  }
  let response
  if (metadata.searchTerm === '') {
    response =
      await sql.query`select * from uvw_person order by last_name offset ${metadata.offset
        } rows fetch next ${metadata.limit + 1} rows only`
  } else {
    response =
      await sql.query`exec usp_person_search_with_pagination @search_text = ${metadata.searchTerm}, @offset = ${metadata.offset}, @rows = ${metadata.limit + 1}`
  }
  let data = response.recordset.map((record) => {
    const url = gravatar.url(record.email)
    record.profile_image_url = url
    return record
  })
  metadata.recordCount = data.length

  if (data.length <= metadata.limit) {
    metadata.reachedEnd = true
  } else {
    // We search for one more record than we need to test if we are at the end of the collection, therefore we have to remove the last record if we *aren't* at the end of the collection
    data = data.slice(0, -1)
    metadata.recordCount = metadata.recordCount - 1
  }
  if (req.header('hx-request')) {
    metadata.partialRender = true
    log.debug(JSON.stringify(data))
    log.debug(JSON.stringify(metadata))
    return res.render('person_table.html', {
      data,
      metadata,
    })
  } else {
    log.debug(JSON.stringify(data))
    log.debug(JSON.stringify(metadata))
    return res.render('person.html', {
      data,
      metadata,
    })
  }
})

app.listen(env.PORT, () => {
  log.info(`Server started on port ${env.PORT}`)
})
