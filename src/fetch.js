const axios = require(`axios`)
const fs = require('fs')
const stringify = require(`json-stringify-safe`)
const httpExceptionHandler = require(`./http-exception-handler`)
const chalk = require('chalk')
const log = console.log

async function fetch({
  url,
  method,
  headers,
  data,
  name,
  localSave,
  path,
  payloadKey,
  auth,
  params,
  verbose,
  reporter,
  cache,
  useCache,
  shouldCache,
  maxCacheDurationSeconds
}) {

  let allRoutes
  let routeData

  // Attempt to download the data from api
  routeData = useCache && await cache.get(url)
  if (!routeData) {
    try {
      let options = {
        method: method,
        url: url,
        headers: headers,
        data: data,
        params: params
      }
      if(auth) {
        options.auth = auth
      }
      allRoutes = await axios(options)
      reporter.verbose(`got url ${url}`)
      routeData = allRoutes.data
      if (shouldCache) {
        await cache.set(url, routeData)
        await cache.set('cacheTimestamp', new Date().toISOString())
      }
    } catch (e) {
      console.log('\nGatsby Source Api Server response error:\n', e.response.data && e.response.data.errors)
      httpExceptionHandler(e, reporter)
    }
  } else {
    reporter.verbose(`using cached data for ${url}`)
  }

  if (routeData) {
    // console.log(`allRoutes: `, allRoutes.data);

    // Create a local save of the json data in the user selected path
    if(localSave) {
      try {
        fs.writeFileSync(`${path}${name}.json`, stringify(routeData, null, 2))
      } catch(err) {
        reporter.panic(`Plugin ApiServer could not save the file.  Please make sure the folder structure is already in place.`, err)
      }

      if(verbose) {
        log(chalk`{bgCyan.black Plugin ApiServer} ${name}.json was saved locally to ${path}`)
      }
    }

    // Return just the intended data
    if(payloadKey) {
      return routeData[payloadKey]
    }
    return routeData
  }
}

module.exports = fetch
