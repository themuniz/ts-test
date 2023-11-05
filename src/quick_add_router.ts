import express, {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from 'express'
import log from './logger.js'

const router: Router = express.Router()

// Routes
router.get(
  '/projects',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await req.app.locals.db
        .query`select * from uvw_project_details order by id desc`
      log.info('Pulled CourseDev project details', { response })
      return res.render('quick_add_projects.html', {
        response: response.recordset,
      })
    } catch (err) {
      next(err)
    }
  },
)

export { router as QuickAddRouter }
