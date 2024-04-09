import express, {
  type Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import log from './logger.js'
import type { SectionSearchMetadata, SectionRecord } from './coursePrep_types.js'
import type { User } from './common_types.js'

const router: Router = express.Router()

const authorizeAndAuthenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Add authorization and authentication, this is just for scaffolding
  res.locals.user =
  {
    id: 9,
    full_name: "José Muñiz",
    first_name: "José",
    last_name: "Muñiz",
    program: "OFDIT",
    program_id: 14,
    email_address: "jose.muniz@cuny.edu",
    gmail_address: "sps.ofdit@gmail.com",
    job_title: "Data Systems & Operations Manager",
    extension: 48631,
    is_grizzly_admin: true,
    is_grizzly_user: true,
    is_active: true,
    active_until_date: null,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZnVsbF9uYW1lIjoiSm9zw6kgTXXDsWl6IiwiZmlyc3RfbmFtZSI6Ikpvc8OpIiwibGFzdF9uYW1lIjoiTXXDsWl6IiwicHJvZ3JhbSI6Ik9GRElUIiwicHJvZ3JhbV9pZCI6MTQsImVtYWlsX2FkZHJlc3MiOiJqb3NlLm11bml6QGN1bnkuZWR1IiwiZ21haWxfYWRkcmVzcyI6InNwcy5vZmRpdEBnbWFpbC5jb20iLCJqb2JfdGl0bGUiOiJEYXRhIFN5c3RlbXMgJiBPcGVyYXRpb25zIE1hbmFnZXIiLCJleHRlbnNpb24iOjQ4NjMxLCJpc19ncml6emx5X2FkbWluIjp0cnVlLCJpc19ncml6emx5X3VzZXIiOnRydWUsImlzX2FjdGl2ZSI6dHJ1ZSwiYWN0aXZlX3VudGlsX2RhdGUiOm51bGwsImlhdCI6MTcxMjY2MzA2MywiZXhwIjoxNzEzOTU5MDYzfQ.FmbfkgX85lv13NBIdk3jv5P6d1A5cqTnSXYtBeJlJuo"
  }
  next()
}

// Routes
router.get('/', authorizeAndAuthenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  const metadata: SectionSearchMetadata = {
    term: String(req.query.term) || 'Spring 2024',
    filter: String(req.query.filter),
    search: String(req.query.search),
    recordCount: 0,
  }

  let response: any

  try {
    // first lets pull all sections by term and search term (if provided)
    if (metadata.search === '') {
      response = await req.app.locals.db
        .query`select * from uvw_cp_sections order by course`
      // .query`select * from uvw_cp_sections order by course where term = ${metadata.term}`
    } else {
      response = await req.app.locals.db
        .query`select * from uvw_cp_sections order by course`
      // .query`select * from uvw_cp_sections order by course where term = ${metadata.term} and course like '%${metadata.search}%'`
    }
    // now lets authorize who can see these sections
    // TODO: figure out with section list we are on and show courses based on that
    let sections: SectionRecord[] = response.recordset[0]
    metadata.recordCount = response.rowsAffected[0] ?? 0
    if (metadata.recordCount === 0) {
      return res.render('no_sections.html')
    }
    if (res.locals.user.program !== 'OFDIT') {
      sections = sections.filter((section) => {
        return section.program.includes(res.locals.user.program)
      })
    }
    // TODO: filter the sections
    if (req.header('hx-request')) {
      log.info(`${res.locals.user.full_name} pulled section data`, { sections, metadata })
      return res.render('coursePrep_section_list.html', {
        sections,
        metadata,
      })
    }
    log.info(`${res.locals.user.full_name} pulled section data`, { sections, metadata })
    return res.render('coursePrep.html', {
      sections,
      metadata,
    })
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
    log.info(`Pulled person data for EMPLID: ${emplid}`, { contractRecords, workshopRecords })
    return res.render('person_details.html', {
      workshopRecords: workshopRecords.recordset,
      contractRecords: contractRecords.recordset,
    })
  } catch (err) {
    next(err)
  }
})

export { router as CoursePrepRouter }
