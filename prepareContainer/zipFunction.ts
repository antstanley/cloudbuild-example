import * as zip from 'zip-local'

const zipFunction = (destination: string): string => {
	let response: string = ''
	try {
		const zipLocation = `${destination}.zip`
		// const dockerFile = join(destination, 'Dockerfile')
		zip.sync
			.zip(destination)
			.compress()
			.save(zipLocation)
		response = zipLocation
	} catch (error) {
		console.error('zipFunction:', error)
	}
	return response
}

export { zipFunction }
