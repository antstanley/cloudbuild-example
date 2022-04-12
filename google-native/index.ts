import * as storage from '@pulumi/google-native/storage/v1'
import * as cloudBuild from '@pulumi/google-native/cloudbuild/v1'
import { createHash } from './createHash'
import { prepareContainer } from '../prepareContainer'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config('google-native')
const project = config.require('project')
const region = config.require('region')

const name = 'testapp-pulumi'

// Create a Google Cloud resource (Storage Bucket)
const bucketName = `${name}-bucket-${createHash(name, 4)}`
const bucket = new storage.Bucket(bucketName, { name: bucketName })

const artifact = prepareContainer(`${name}-container`, {
  source: '../testapp',
  destination: '../dist'
})

const buildName = `${name}-build`.toLowerCase()

const bucketObjectOptions = {
  name: `${name}-${Date.now()}.zip`,
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
    '.': new pulumi.asset.FileArchive(artifact)
  })
}

const bucketObject = new storage.BucketObject(name, bucketObjectOptions)

const registryName = 'us-central1-docker.pkg.dev/<project-name>/<registry-name>'

const newImageName = `${name}-image`
const tag = `${registryName}/${newImageName}:${Date.now()}`

const buildStepArgs = ['build', '-t', tag, `.`]

const buildArgs: cloudBuild.BuildArgs = {
  projectId: project,
  steps: [
    {
      name: 'gcr.io/cloud-builders/docker',
      args: buildStepArgs
    }
  ],
  source: {
    storageSource: {
      bucket: bucketName,
      object: bucketObject.name
    }
  },
  images: [tag],
  project,
  location: region
}

const build = new cloudBuild.Build(buildName, buildArgs, {
  dependsOn: bucketObject
})

export { build }
