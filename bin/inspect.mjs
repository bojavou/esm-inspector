#!/usr/bin/env node

import ChangeStream from '#lib/stream/change.mjs'
import validate from '#lib/validate.mjs'

const changes = new ChangeStream()

let compressed = false
for await (const change of changes) {
  if (change.deleted) {
    console.log('DELETED:', change.id)
    compressed = true
    continue
  } else {
    if (compressed) console.log()
    compressed = false
    await validate(change.id)
    console.log()
  }
}
