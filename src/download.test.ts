import * as fetch from 'node-fetch'
import * as os from 'os'
import * as fs from 'fs'
import * as fsUtils from './fs'

import {downloadCodeClimateExecutable} from './download'

jest.mock('node-fetch')
jest.mock('os')
jest.mock('fs')
jest.mock('./fs')

describe('download', () => {
  const fetchResponseBodyPipeSpy = jest.fn()
  const fsWriteStreamOnSpy = jest
    .fn()
    .mockImplementation((eventName, callback) => {
      if (eventName === 'close') {
        callback()
      }
    })
  const createWriteStreamReturnValue = ({
    on: fsWriteStreamOnSpy
  } as unknown) as ReturnType<typeof fs.createWriteStream>

  beforeEach(() => {
    // fetchResponseBodyPipeSpy.mockRestore();

    jest.spyOn(os, 'platform').mockReturnValue('linux')
    jest.spyOn(fetch, 'default').mockResolvedValue(({
      body: {
        pipe: fetchResponseBodyPipeSpy
      }
    } as unknown) as ReturnType<typeof fetch.default>)
    jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue(createWriteStreamReturnValue)
    jest
      .spyOn(fsUtils, 'getTemporalFileAbsolutePath')
      .mockResolvedValue('/tmp/fake-folder/fake-file')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#downloadCodeClimateExecutable', () => {
    it('should download proper file', async () => {
      await downloadCodeClimateExecutable()

      expect(fetch.default).toHaveBeenCalledWith(
        'https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64'
      )
    })

    it('should write downloaded file in temporal folder', async () => {
      await downloadCodeClimateExecutable()

      expect(fs.createWriteStream).toHaveBeenCalledWith(
        '/tmp/fake-folder/fake-file'
      )
      expect(fetchResponseBodyPipeSpy).toHaveBeenCalledWith(
        createWriteStreamReturnValue
      )
    })

    it('should reject promise on error', async () => {
      fsWriteStreamOnSpy.mockImplementation((eventName, callback) => {
        if (eventName === 'error') {
          callback(new Error('Forced error'))
        }
      })

      await expect(downloadCodeClimateExecutable()).rejects.toThrow(
        'Forced error'
      )
    })
  })
})
