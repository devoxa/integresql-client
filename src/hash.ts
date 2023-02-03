import crypto from 'crypto'
import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'

export async function sha1HashFiles(globPatterns: Array<string>): Promise<string> {
  const files = await glob(globPatterns)
  const filePaths = files.map((file) => path.join(process.cwd(), file))

  const fileHashes = await Promise.all(filePaths.map(sha1HashFile))
  return sha1HashString(fileHashes.join(''))
}

export function sha1HashString(value: string): string {
  return crypto.createHash('sha1').update(value).digest('hex')
}

export function sha1HashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    const readStream = fs.createReadStream(filePath)

    // istanbul ignore next
    readStream.on('error', (err) => reject(err))

    readStream.on('data', (chunk) => hash.update(chunk))
    readStream.on('end', () => resolve(hash.digest('hex')))
  })
}
