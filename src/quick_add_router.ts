import express, { type Request, type Response, Router } from 'express'
import log from './logger.js'

const router: Router = express.Router()

// Routes
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const response = await req.app.locals.db
      .query`select * from uvw_project_details order by id desc`
    log.debug('Project options')
    console.log(response.recordset)
    return res.render('quick_add_projects.html', {
      response: response.recordset,
    })
  } catch (err) {
    console.error(err)
  }
})

export { router as QuickAddRouter }
