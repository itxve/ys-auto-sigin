import {MysApi} from './api'

export default async (cookie: string, uid: string) => {
  const myh = new MysApi()
  myh.uidSet(uid)
  myh.cookieSet(cookie)
  const res = await myh.getData('bbs_sign')
  console.log(res)
}
