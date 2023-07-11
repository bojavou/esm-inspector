#!/usr/bin/env node

import ChangeStream from '#lib/stream/change.mjs'
import log from '#lib/log.mjs'
import validate from '#lib/validate.mjs'

const changes = new ChangeStream()

for await (const change of changes) {
  if (change.deleted) {
    log(change.id, 'deleted')
    continue
  }
  await validate(change.id)
}
