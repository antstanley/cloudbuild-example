import * as crypto from 'crypto'

function createHash (data: string, len: number): string {
	return crypto
		.createHash('shake256', { outputLength: len })
		.update(data)
		.digest('hex')
}

export { createHash }
