// import { cpSync, CopyOptions } from 'fs'
import * as fs from 'fs'

const copyFiles = (source: string, destination: string): boolean => {
	let response = false
	try {
		const copyOptions: fs.CopyOptions = {
			force: true,
			recursive: true,
		}

		fs.cpSync(source, destination, copyOptions)

		response = true
	} catch (error) {
		console.error('copyFiles:', error)
	}
	return response
}

export { copyFiles }
