import express, { Request, Response } from 'express'
import { z } from 'zod'
import 'dotenv/config'
import * as sql from 'mssql'

const app = express()
const envVariables = z.object({
  PORT: z.string(),
})
const env = envVariables.parse(process.env)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// DB
const testDB = async () => {
  console.log('data function called')
  try {
    await sql.connect(
      'Server=localhost,1433;Database=Dev;User Id=sa;Password=Yauco4020!;trustServerCertificate=true',
    )
    const result = await sql.query`select * from uvw_person`
    console.log('data function successfully called')
    return result
  } catch (err) {
    console.error(`Error: ${err}`)
  }
}
// Routes
app.get('/', async (req: Request, res: Response) => {
  const response = await testDB()
  return res.send(`${JSON.stringify(response)}`)
})

app.listen(env.PORT, () => {
  console.log(`Started on port ${env.PORT}`)
})
