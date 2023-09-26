import express, { Request, Response } from 'express'
import { z } from 'zod'
import 'dotenv/config'
import * as sql from 'mssql'
import nunjucks from 'nunjucks'
import * as gravatar from 'gravatar'

const app = express()

// Process .env config
const envVariables = z.object({
  NODE_ENV: z.enum(["production", "development", "testing"]),
  PORT: z.coerce.number(),
  DB_DATABASE: z.string(),
  DB_SERVER: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
})
const env = envVariables.parse(process.env)

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

// Routes
app.get('/', async (req: Request, res: Response) => {
  await sql.connect(dbConfig)
  let page = 1
  let offset = 0
  let limit = 50
  if (req.query.page) {
    const pageAsString = String(req.query.page)
    page = parseInt(pageAsString)
  }
  if (req.query.limit) {
    const limitAsString = String(req.query.limit)
    limit = parseInt(limitAsString)
  }
  if (page > 1) {
    offset = (page * limit) - limit
  }
  const response =
    await sql.query`select * from uvw_person order by last_name offset ${offset} rows fetch next ${limit} rows only`
  const data = response.recordset.map((record) => {
    const url = gravatar.url(record.email)
    record.profile_image_url = url
    return record
  })
  const recordCount = data.length
  return res.render('person.html', { data: data, page, recordCount, limit })
})

app.listen(env.PORT, () => {
  console.log(`Started on port ${env.PORT}`)
})
