import * as core from '@actions/core'
import entryPoint from './ys'

async function run(): Promise<void> {
  try {
    const userStr: string = core.getInput('users') || ''
    let cks: Array<{cookie: string; uid: string}>
    try {
      cks = JSON.parse(userStr.trim())
    } catch (error) {
      core.setFailed('格式错误,请参考readme')
      return
    }
    console.log('cks:', cks)
    for (let index = 0; index < cks!.length; index++) {
      const user = cks![index]
      if (user) {
        await entryPoint(user.cookie, user.uid)
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
run()
