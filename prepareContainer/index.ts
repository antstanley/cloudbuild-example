import { zipFunction } from './zipFunction'
import { copyFiles } from './copyFiles'
import { join } from 'path'
import { mkdirSync, lstatSync, rmSync } from 'fs'

interface prepareOptions {
  source: string
  destination?: string
}

const prepareContainer = (name: string, options: prepareOptions): string => {
  let response: string = ''
  try {
    // compare input values against defaults, and apply defaults if no value supplied
    const source = options.source
    const destination = options.destination ?? `dist`

    // validate Source
    const sourcePath = join(process.cwd(), source)
    const sourceExist = lstatSync(sourcePath, { throwIfNoEntry: false })

    if (typeof sourceExist === 'undefined') {
      throw new Error(`Container context ${sourcePath} does not exist`)
    }

    // prepare destination
    const destinationPath = join(process.cwd(), destination, name)
    const destExist = lstatSync(destinationPath, { throwIfNoEntry: false })

    if (typeof destExist === 'undefined') {
      mkdirSync(destinationPath, { recursive: true })
    } else {
      rmSync(destinationPath, { recursive: true, force: true })
      mkdirSync(destinationPath, { recursive: true })
    }

    const zipReady = copyFiles(sourcePath, destinationPath)

    if (zipReady) response = zipFunction(destinationPath)
  } catch (error) {
    console.error('prepareContainer:', error)
  }
  return response
}

export { prepareContainer }
