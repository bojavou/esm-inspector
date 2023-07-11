#!/usr/bin/env node

import ChangeStream from '#lib/stream/change.mjs'
import commandLineArgs from 'command-line-args'
import log from '#lib/log.mjs'
import validate from '#lib/validate.mjs'

const options = commandLineArgs([
  { name: 'token', alias: 't', type: Number }
])

const changes = new ChangeStream(options)

for await (const change of changes) {
  if (change.deleted) {
    log(change.id, 'deleted')
    continue
  }
  await validate(change.id)
}
