import crypto, {CharacterEncoding} from 'crypto'
import axios from 'axios'
type ApiMap = {
  [key: string]: {url: string; query?: string; body?: any; sign?: boolean}
}

export class MysApi {
  uid: string
  server: string
  cookie?: string
  _device?: string

  constructor() {
    this.uid = ''
    this.server = this.getServer()
  }
  uidSet(uid: string) {
    this.uid = uid
    this.server = this.getServer()
  }
  cookieSet(cookie: string) {
    this.cookie = cookie
  }

  md5(str: any, encoding = 'utf8') {
    return crypto
      .createHash('md5')
      .update(str, encoding as CharacterEncoding)
      .digest('hex')
  }

  getUrl(type: string, data: {[key: string]: any} = {}): any {
    let host, hostRecord
    if (['cn_gf01', 'cn_qd01'].includes(this.server)) {
      host = 'https://api-takumi.mihoyo.com'
      hostRecord = 'https://api-takumi-record.mihoyo.com'
    }

    let urlMap: ApiMap = {
      //hk4e_cn 原神
      gameInfo: {
        url: `${host}/binding/api/getUserGameRolesByCookie?game_biz=hk4e_cn`,
        query: ''
      },
      /** 首页宝箱 */
      index: {
        url: `${hostRecord}/game_record/app/genshin/api/index`,
        query: `role_id=${this.uid}&server=${this.server}`
      },
      /** 深渊 */
      spiralAbyss: {
        url: `${hostRecord}/game_record/app/genshin/api/spiralAbyss`,
        query: `role_id=${this.uid}&schedule_type=${
          data.schedule_type || 1
        }&server=${this.server}`
      },
      /** 角色详情 */
      character: {
        url: `${hostRecord}/game_record/app/genshin/api/character`,
        body: {
          role_id: this.uid,
          server: this.server
        }
      },
      /** 树脂 */
      dailyNote: {
        url: `${hostRecord}/game_record/app/genshin/api/dailyNote`,
        query: `role_id=${this.uid}&server=${this.server}`
      },
      /** 签到信息 */
      bbs_sign_info: {
        url: `${host}/event/bbs_sign_reward/info`,
        query: `act_id=e202009291139501&region=${this.server}&uid=${this.uid}`,
        sign: true
      },
      /** 签到奖励 */
      bbs_sign_home: {
        url: `${host}/event/bbs_sign_reward/home`,
        query: `act_id=e202009291139501&region=${this.server}&uid=${this.uid}`,
        sign: true
      },
      /** 签到 */
      bbs_sign: {
        url: `${host}/event/bbs_sign_reward/sign`,
        body: {
          act_id: 'e202009291139501',
          region: this.server,
          uid: this.uid
        },
        sign: true
      },
      /** 详情 */
      detail: {
        url: `${host}/event/e20200928calculate/v1/sync/avatar/detail`,
        query: `uid=${this.uid}&region=${this.server}&avatar_id=${data.avatar_id}`
      },
      /** 札记 */
      ys_ledger: {
        url: 'https://hk4e-api.mihoyo.com/event/ys_ledger/monthInfo',
        query: `month=${data.month}&bind_uid=${this.uid}&bind_region=${this.server}`
      },
      /** 养成计算器 */
      compute: {
        url: `${host}/event/e20200928calculate/v2/compute`,
        body: data
      },
      /** 角色技能 */
      avatarSkill: {
        url: `${host}/event/e20200928calculate/v1/avatarSkill/list`,
        query: `avatar_id=${data.avatar_id}`
      }
    }
    if (!urlMap[type]) return

    let {url, query = '', body = '', sign = ''} = urlMap[type]

    if (query) url += `?${query}`
    if (body) body = JSON.stringify(body)

    let headers = this.getHeaders(query, body, !!sign)

    return {
      url,
      headers,
      body
    }
  }

  getServer() {
    let uid = this.uid
    switch (String(uid)[0]) {
      case '1':
      case '2':
        return 'cn_gf01' // 官服
      case '5':
        return 'cn_qd01' // B服
    }
    return 'cn_gf01'
  }

  async getData(type: string, data = {}) {
    let {url, headers, body} = this.getUrl(type, data)
    if (!url) return false
    headers.Cookie = this.cookie

    let param: any = {}
    if (body) {
      param.method = 'post'
      param.body = body
    } else {
      param.method = 'get'
    }
    let response: any
    let start = Date.now()
    try {
      response = await axios.request({
        method: param.method,
        url,
        headers,
        timeout: 10000,
        data: param.body
      })
    } catch (error) {
      console.error(error)
      return false
    }

    let res = response.data
    console.log(
      `[米游社接口][${param.method}][${type}][${this.uid}] ${
        Date.now() - start
      }ms`
    )
    if (!res) {
      console.log('mys接口没有返回')
      return false
    }

    if (res.retcode !== 0) {
      console.debug(`[米游社接口][请求参数] ${url} ${JSON.stringify(res)}`)
    }
    res.api = type

    return res
  }

  getHeaders(query = '', body = '', sign = false) {
    if (sign) {
      return {
        'x-rpc-app_version': '2.36.1',
        'x-rpc-client_type': 5,
        'x-rpc-device_id': this.getGuid(),
        'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/2.36.1`,
        'X-Requested-With': 'com.mihoyo.hyperion',
        'x-rpc-platform': 'android',
        'x-rpc-device_model': this.device,
        'x-rpc-device_name': this.device,
        'x-rpc-channel': 'miyousheluodi',
        'x-rpc-sys_version': '6.0.1',
        Referer:
          'https://webstatic.mihoyo.com/bbs/event/signin-ys/index.html?bbs_auth_required=true&act_id=e202009291139501&utm_source=bbs&utm_medium=mys&utm_campaign=icon',
        DS: this.getDsSign()
      }
    }
    return {
      'x-rpc-app_version': '2.36.1',
      'x-rpc-client_type': 5,
      'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/2.36.1`,
      DS: this.getDs(query, body)
    }
  }

  getDs(q = '', b = '') {
    let n = ''
    if (['cn_gf01', 'cn_qd01'].includes(this.server)) {
      n = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs'
    }
    let t = Math.round(new Date().getTime() / 1000)
    let r = Math.floor(Math.random() * 900000 + 100000)
    let DS = this.md5(`salt=${n}&t=${t}&r=${r}&b=${b}&q=${q}`)
    return `${t},${r},${DS}`
  }

  /** 签到ds */
  getDsSign() {
    const n = 'YVEIkzDFNHLeKXLxzqCA9TzxCpWwbIbk'
    const t = Math.round(new Date().getTime() / 1000)
    const r = this.randomString(6)
    const DS = this.md5(`salt=${n}&t=${t}&r=${r}`)
    return `${t},${r},${DS}`
  }

  getGuid() {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }
    return (
      S4() +
      S4() +
      '-' +
      S4() +
      '-' +
      S4() +
      '-' +
      S4() +
      '-' +
      S4() +
      S4() +
      S4()
    )
  }

  randomString(length: number) {
    const characterSet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const characterLen = characterSet.length
    let result = ''
    for (let i = 0; i < length; i++) {
      const randNum = Math.floor(Math.random() * characterLen)
      result += characterSet.charAt(randNum)
    }
    return result
  }

  /* eslint-disable quotes */
  get device() {
    if (!this._device)
      this._device = `bd7f912e-908c-3692-a520-e70206${this.md5(
        this.uid
      ).substring(0, 5)}`
    return this._device
  }
}
