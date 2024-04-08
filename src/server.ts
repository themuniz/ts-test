import { app, env } from './index.js'
import log from './logger.js'

app.listen(env.PORT, () => {
    log.info(`🔋 Server started on port ${env.PORT}`)
})

