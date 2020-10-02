import {platform} from 'os'
import fs from 'fs'
import fetch from 'node-fetch'
import {getTemporalFileAbsolutePath} from './fs'

export async function downloadCodeClimateExecutable(): Promise<string> {
  const executableFilename = `test-reporter-latest-${platform()}-amd64`
  const executableUrl = `https://codeclimate.com/downloads/test-reporter/${executableFilename}`

  const temporalFileAbsolutePath = await getTemporalFileAbsolutePath({
    parentFolderPrefix: 'code-climate',
    filename: executableFilename
  })

  const response = await fetch(executableUrl)

  const writeStream = fs.createWriteStream(temporalFileAbsolutePath)
  response.body.pipe(writeStream)

  await new Promise((resolve, reject) =>
    fs.chmod(temporalFileAbsolutePath, 0o775, error =>
      error ? reject(error) : resolve()
    )
  )

  await new Promise<void>((resolve, reject) => {
    writeStream.on('close', () => resolve())
    writeStream.on('error', error => reject(error))
  })

  return temporalFileAbsolutePath
}
