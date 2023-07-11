/* global CountQueuingStrategy ReadableStream */

import Keyv from '@keyvhq/core'
import KeyvFile from '@keyvhq/file'
import nano from 'nano'
import os from 'node:os'
import path from 'node:path'

const address = 'https://replicate.npmjs.com'

class ChangeStream extends ReadableStream {
  constructor (options = {}) {
    const source = new ChangeStreamSource(options)
    const strategy = new CountQueuingStrategy({ highWaterMark: 1000 })
    super(source, strategy)
  }
}

class ChangeStreamSource {
  #controller
  #reader
  #store
  #advance
  #last

  constructor (options) {
    this.#last = options.token ?? 0
    const backing = options.store ?? path.join(os.homedir(), '.esminspector')
    this.#store = new Keyv({ store: new KeyvFile(backing) })
  }

  async start (controller) {
    this.#controller = controller
    if (await this.#store.has('!token')) {
      this.#last = await this.#store.get('!token')
    }
    const client = nano(address)
    const registry = client.use('registry')
    this.#reader = registry.changesReader
    this.#reader.start({
      wait: true,
      since: this.#last,
      batchSize: 100
    })
      .once('error', this.#error.bind(this))
      .on('seq', this.#token.bind(this))
      .on('batch', this.#batch.bind(this))
  }

  pull () { this.#reader.resume() }
  cancel () { this.#reader.stop() }

  #batch (batch) {
    let enqueued = false
    for (const change of batch) {
      this.#controller.enqueue(change)
      enqueued = true
    }
    if (!enqueued) this.#reader.resume()
  }

  #error (error) { this.#controller.error(error) }

  async #token (token) {
    this.#last = token
    this.#advance = Promise.resolve(this.#advance)
      .then(() => this.#store.set('!token', token))
  }
}

export default ChangeStream
