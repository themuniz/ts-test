import express, {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import log from './logger.js'
import * as gravatar from 'gravatar'
import { type PersonRecord, type PersonSearchMetadata } from './person_types.js'

const router: Router = express.Router()

// Routes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const metadata: PersonSearchMetadata = {
    page: 1,
    offset: 0,
    limit: 10,
    reachedEnd: false,
    searchTerm: '',
    partialRender: false,
    recordCount: 0,
  }
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
  try {
    if (metadata.searchTerm === '') {
      response = await req.app.locals.db
        .query`select * from uvw_person order by last_name offset ${metadata.offset
        } rows fetch next ${metadata.limit + 1} rows only`
    } else {
      response = await req.app.locals.db
        .query`exec usp_person_search_with_pagination @search_text = ${metadata.searchTerm
        }, @offset = ${metadata.offset}, @rows = ${metadata.limit + 1}`
    }
    let data = response.recordset.map((record: PersonRecord) => {
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
  } catch (err) {
    next(err)
  }
})

router.get('/:emplid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emplid = req.params.emplid
    const workshopRecords = await req.app.locals.db
      .query`select * from uvw_workshop_masterlist where emplid = ${emplid}`
    const contractRecords = await req.app.locals.db
      .query`select * from uvw_contracts_extended where emplid = ${emplid}`
    log.debug('Response: ', { workshopRecords, contractRecords })
    return res.render('person_details.html', {
      workshopRecords: workshopRecords.recordset,
      contractRecords: contractRecords.recordset,
    })
  } catch (err) {
    next(err)
  }
})

export { router as PersonRouter }
