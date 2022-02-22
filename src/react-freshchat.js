import _ from 'lodash/fp'
import React from 'react'

class Queue {
  constructor() {
    this.data = []
    this.index = 0
  }

  queue(value) {
    this.data.push(value)
  }

  dequeue() {
    if (this.index > -1 && this.index < this.data.length) {
      let result = this.data[this.index++]

      if (this.isEmpty) {
        this.reset()
      }

      return result
    }
  }

  get isEmpty() {
    return this.index >= this.data.length
  }

  dequeueAll(cb) {
    if (!_.isFunction(cb)) {
      throw new Error(`Please provide a callback`)
    }

    while (!this.isEmpty) {
      let { method, args } = this.dequeue()
      cb(method, args)
    }
  }

  reset() {
    this.data.length = 0
    this.index = 0
  }
}

let fakeWidget
let earlyCalls = new Queue()

export let widget = (fake = fakeWidget) => {
  if (window.fcWidget) return window.fcWidget
  if (!fake) fake = mockMethods(availableMethods)
  return fake
}

let mockMethods = methods => {
  let obj = {}
  methods.forEach(method => {
    obj = _.set(method, queueMethod(method), obj)
  })
  return obj
}

let queueMethod = method => (...args) => {
  earlyCalls.queue({ method, args })
}

let loadScript = () => {
  let id = 'freshchat-lib'
  if (document.getElementById(id) || window.fcWidget) return
  let script = document.createElement('script')
  script.async = 'true'
  script.type = 'text/javascript'
  script.src = 'https://wchat.eu.freshchat.com/js/widget.js'
  script.id = id
  document.head.appendChild(script)
}

class FreshChat extends React.Component {
  constructor(props) {
    super(props)
    
    let { token, ...moreProps } = props

    if (!token) {
      throw new Error(`token is required`)
    }

    this.init({
      host: 'https://wchat.eu.freshchat.com',
      token,
      ...moreProps,
    })
  }

  init(settings) {
    if (settings.onInit) {
      let tmp = settings.onInit
      settings.onInit = () => tmp(widget())
    }

    if (window.fcWidget) {
      window.fcWidget.init(settings)
      if (settings.onInit) {
        settings.onInit()
      }
    } else {
      this.lazyInit(settings)
    }
  }

  lazyInit(settings) {
    widget().init(settings) // Can't use window.fcSettings because sometimes it doesn't work

    loadScript()

    let interval = setInterval(() => {
      if (window.fcWidget) {
        clearInterval(interval)
        try {
          earlyCalls.dequeueAll((method, value) => {
            window.fcWidget[method](...value)
          })
        } catch (e) {
          console.error(e)
        }
        if (settings.onInit) {
          settings.onInit()
        }
      }
    }, 1000)
  }

  render() {
    return false
  }

  componentWillUnmount() {
    widget().close()
  }
}

let availableMethods = [
  'close',
  'destroy',
  'hide',
  'init',
  'isInitialized',
  'isLoaded',
  'isOpen',
  'off',
  'on',
  'open',
  'setConfig',
  'setExternalId',
  'setFaqTags',
  'setTags',
  'track',
  'user.show',
  'user.track',
  'user.user',
  'user.clear',
  'user.create',
  'user.get',
  'user.isExists',
  'user.setEmail',
  'user.setFirstName',
  'user.setLastName',
  'user.setMeta',
  'user.setPhone',
  'user.setPhoneCountryCode',
  'user.setProperties',
  'user.update',
]

export default FreshChat
