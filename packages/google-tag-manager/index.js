const path = require('path')
const { defaultsDeep } = require('lodash')

module.exports = async function nuxtTagManager(_options) {
  const options = defaultsDeep({}, _options, this.options['google-tag-manager'], {
    id: null,
    layer: 'dataLayer',
    pageTracking: false,
    respectDoNotTrack: false,
    dev: true,
    env: {}, // env is supported for backward compability and is alias of query
    query: {}
  })

  // Don't include when run in dev mode unless dev: true is configured
  if (this.options.dev && !options.dev) {
    return
  }

  // Don't include when no GTM id is given
  if (!options.id) {
    return
  }

  if (typeof (options.id) === 'function') {
    options.id = await options.id()
  }

  // Build the <script> URL
  const queryParams = Object.assign({}, options.env, options.query)

  queryParams.id = options.id

  if (options.layer) {
    queryParams.l = options.layer
  }

  const queryString = Object.keys(queryParams)
    .filter(key => queryParams[key] !== null && queryParams[key] !== undefined)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&')

  // Add google tag manager script to head
  this.options.head.script.push({
    src: (options.scriptURL || '//www.googletagmanager.com/gtm.js') + '?' + queryString,
    async: true
  })

  // append google tag manager <noscript> fallback to <body>
  // TODO: change it to prepend it to <body> once this one is merged + released:
  // https://github.com/nuxt/vue-meta/pull/410
  this.options.head.noscript.push({
    vmid: 'gtm-noscript',
    innerHTML: `<iframe src="//www.googletagmanager.com/ns.html?id=${options.id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
    body: true
  })

  // disables sanitazion for gtm noscript as we're using .innerHTML
  this.options.head.__dangerouslyDisableSanitizersByTagID = Object.assign({}, this.options.head.__dangerouslyDisableSanitizersByTagID, {
    'gtm-noscript': ['innerHTML']
  })


  // Register plugin
  this.addPlugin({
    src: path.resolve(__dirname, 'plugin.js'),
    fileName: 'google-tag-manager.js',
    ssr: false,
    options
  })
}

module.exports.meta = require('./package.json')
