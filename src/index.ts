import express, { Request, Response } from 'express'
import { z } from 'zod'
import 'dotenv/config'
import * as sql from 'mssql'

const app = express()

// Process .env config
const envVariables = z.object({
  PORT: z.string(),
  DB_DATABASE: z.string(),
  DB_SERVER: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
})
const env = envVariables.parse(process.env)

// Express configs and middlewear
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
  const response = await sql.query`select * from uvw_person`
  return res.send(`${JSON.stringify(response.recordset)}`)
})

app.listen(env.PORT, () => {
  console.log(`Started on port ${env.PORT}`)
})
