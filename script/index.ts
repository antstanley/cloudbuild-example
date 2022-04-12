import { CloudBuildClient } from '@google-cloud/cloudbuild'
import { Bucket, Storage } from '@google-cloud/storage'
import { prepareContainer } from '../prepareContainer'
import { createHash } from './createHash'

const cbClient = new CloudBuildClient()
const storageClient = new Storage()

async function createBucketUpload (
  name: string,
  location: string,
  artifact: string
): Promise<{ bucketName: string; fileName: string; gcsUri: string }> {
  const newBucketName = `${name}-${createHash(name, 6)}`
  let bucket: Bucket | undefined

  const bucketLocation = location ?? 'us-central1'

  try {
    bucket = storageClient.bucket(newBucketName)
    await bucket.getFiles()
    console.log(`Bucket ${newBucketName} Exists`)
  } catch (error) {
    await storageClient.createBucket(newBucketName, {
      location: bucketLocation
    })
    bucket = storageClient.bucket(newBucketName)
    console.log(`Bucket ${newBucketName} created ...`)
  }

  console.log(`Uploading file ${artifact} to ${newBucketName} ...`)

  const files = await bucket.upload(artifact, {
    destination: `container-${Date.now()}.zip`
  })

  const bucketName = files[0].metadata.bucket
  const fileName = files[0].metadata.name
  const gcsUri = `gs://${bucketName}/${fileName}`

  return { bucketName, fileName, gcsUri }
}

async function createCloudBuild () {
  const projectId = await cbClient.auth.getProjectId()

  const name = 'testapp'
  const containerTag = Date.now()
  const registryName =
    'us-central1-docker.pkg.dev/<project-name>/<registry-name>'

  const artifact = prepareContainer('testAppContainer', {
    source: './testapp',
    destination: './dist'
  })
  console.log('Create bucket and upload ...')
  const { bucketName, fileName } = await createBucketUpload(
    `${name}-demo-bucket`,
    'us-central1',
    artifact
  )

  const tag = `${registryName}/${name}:${containerTag}`
  const buildStepArgs = ['build', '-t', tag, `.`]

  const buildOpts = {
    projectId,
    parent: `projects/${projectId}/locations/us-central1`,
    build: {
      steps: [
        {
          name: 'gcr.io/cloud-builders/docker',
          args: buildStepArgs
        }
      ],
      source: {
        storageSource: {
          bucket: bucketName,
          object: fileName
        }
      },
      images: [tag]
    }
  }
  console.log('Submit build to Cloud Build ...')
  console.time('Build Time')
  const [operation] = await cbClient.createBuild(buildOpts)
  console.log('Wait for build to complete ...')
  await operation.promise()
  console.timeEnd('Build Time')
  console.log('Build Complete!')
}

console.log('Starting build... ')
createCloudBuild()
