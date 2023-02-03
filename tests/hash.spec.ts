import path from 'path'
import * as hash from '../src/hash'

describe('hash', () => {
  it('can sha1 hash a string', () => {
    expect(hash.sha1HashString('foobar')).toEqual('8843d7f92416211de9ebb963ff4ce28125932878')
  })

  it('can sha1 hash a single file', async () => {
    const filePath = path.join(process.cwd(), './tests/__fixtures__/a.txt')

    expect(await hash.sha1HashFile(filePath)).toEqual('8843d7f92416211de9ebb963ff4ce28125932878')
  })

  it('can sha1 hash multiple files', async () => {
    const globPatterns = ['./tests/__fixtures__/*.txt']

    expect(await hash.sha1HashFiles(globPatterns)).toEqual(
      '4c4e34c11aa1207fcb0cca37ebec752f75584559'
    )
  })
})
