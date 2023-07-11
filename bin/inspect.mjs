#!/usr/bin/env node

import ChangeStream from '#lib/stream/change.mjs'

const changes = new ChangeStream()
for await (const change of changes) {
  if (change.deleted) {
    console.log('DELETED:', change.id)
    continue
  }
  console.log(change.id)
}
