const fs = require('fs')
const readline = require('readline')

// get the log file path from command line
// example: node analyzer.js sample.log
const logFile = process.argv[2]

if (!logFile) {
  console.log('Please provide a log file path.')
  console.log('Example: node analyzer.js sample.log')
  process.exit(1)
}

if (!fs.existsSync(logFile)) {
  console.log('File not found: ' + logFile)
  process.exit(1)
}

// ---- counters and storage ----
let totalLines     = 0
let malformedLines = 0
let totalRequests  = 0

// status code groups: 2xx, 3xx, 4xx, 5xx
let statusCodes = {}

// store each endpoint and its response times
// example: { '/api/users': [142, 53, 200] }
let endpointTimes = {}

// store how many requests each IP made
// example: { '192.168.1.42': 5 }
let ipCount = {}

// ---- helper: parse response time to milliseconds ----
// handles: 142ms, 0.142s, 142
function parseResponseTime(str) {
  if (!str) return null

  str = str.trim()

  if (str.endsWith('ms')) {
    let val = parseFloat(str.replace('ms', ''))
    if (!isNaN(val)) return val
  }

  if (str.endsWith('s')) {
    let val = parseFloat(str.replace('s', ''))
    if (!isNaN(val)) return val * 1000 // convert to ms
  }

  // plain number
  let val = parseFloat(str)
  if (!isNaN(val)) return val

  return null
}

// ---- helper: parse a single log line ----
// returns an object if valid, or null if malformed
function parseLine(line) {
  line = line.trim()

  // skip blank lines
  if (line === '') return null

  // skip JSON lines (starts with { )
  if (line.startsWith('{')) return null

  // split line into parts by spaces
  let parts = line.split(' ')

  // we need at least 6 parts: timestamp ip method path status responsetime
  if (parts.length < 6) return null

  let timestamp    = parts[0]
  let ip           = parts[1]
  let method       = parts[2]
  let urlPath      = parts[3]
  let status       = parts[4]
  let responseTime = parts[5]

  // validate IP (basic check)
  if (!ip.match(/^\d+\.\d+\.\d+\.\d+$/)) return null

  // validate HTTP method
  let validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  if (!validMethods.includes(method)) return null

  // validate status code — skip if missing or '-'
  let statusNum = parseInt(status)
  if (isNaN(statusNum)) statusNum = null

  // parse response time
  let timeMs = parseResponseTime(responseTime)

  return {
    timestamp,
    ip,
    method,
    path: urlPath,
    status: statusNum,
    responseTime: timeMs
  }
}

// ---- read file line by line ----
const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity
})

rl.on('line', function(line) {
  totalLines++

  let parsed = parseLine(line)

  if (parsed === null) {
    // blank and JSON lines are not really malformed, just skip quietly
    let trimmed = line.trim()
    if (trimmed !== '' && !trimmed.startsWith('{')) {
      malformedLines++
    }
    return
  }

  totalRequests++

  // count status codes
  if (parsed.status !== null) {
    let code = String(parsed.status)
    if (!statusCodes[code]) statusCodes[code] = 0
    statusCodes[code]++
  }

  // store response time per endpoint
  if (parsed.responseTime !== null) {
    if (!endpointTimes[parsed.path]) endpointTimes[parsed.path] = []
    endpointTimes[parsed.path].push(parsed.responseTime)
  }

  // count requests per IP
  if (!ipCount[parsed.ip]) ipCount[parsed.ip] = 0
  ipCount[parsed.ip]++
})

rl.on('close', function() {
  // ---- build the report ----

  console.log('')
  console.log('==========================================')
  console.log('         LOG ANALYZER — REPORT           ')
  console.log('==========================================')
  console.log('File: ' + logFile)
  console.log('')

  // general stats
  console.log('--- General Stats ---')
  console.log('Total lines in file : ' + totalLines)
  console.log('Total valid requests: ' + totalRequests)
  console.log('Malformed lines     : ' + malformedLines)
  console.log('')

  // status code breakdown
  console.log('--- Status Code Breakdown ---')
  let twoxx = 0, threexx = 0, fourxx = 0, fivexx = 0

  Object.keys(statusCodes).forEach(function(code) {
    let count = statusCodes[code]
    let num = parseInt(code)
    if (num >= 200 && num < 300) twoxx   += count
    if (num >= 300 && num < 400) threexx += count
    if (num >= 400 && num < 500) fourxx  += count
    if (num >= 500 && num < 600) fivexx  += count
  })

  console.log('2xx (Success)   : ' + twoxx)
  console.log('3xx (Redirect)  : ' + threexx)
  console.log('4xx (Client err): ' + fourxx)
  console.log('5xx (Server err): ' + fivexx)
  console.log('')

  // top 5 slowest endpoints (by average response time)
  console.log('--- Top 5 Slowest Endpoints (avg response time) ---')

  let endpointAvgs = []

  Object.keys(endpointTimes).forEach(function(ep) {
    let times = endpointTimes[ep]
    let avg = times.reduce(function(a, b) { return a + b }, 0) / times.length
    endpointAvgs.push({ path: ep, avg: avg, count: times.length })
  })

  // sort by avg descending
  endpointAvgs.sort(function(a, b) { return b.avg - a.avg })

  let top5endpoints = endpointAvgs.slice(0, 5)

  top5endpoints.forEach(function(ep, i) {
    console.log((i + 1) + '. ' + ep.path)
    console.log('   Avg: ' + ep.avg.toFixed(2) + 'ms  |  Requests: ' + ep.count)
  })

  if (top5endpoints.length === 0) console.log('No data.')
  console.log('')

  // top 5 most active IPs
  console.log('--- Top 5 Most Active IPs ---')

  let ipList = Object.keys(ipCount).map(function(ip) {
    return { ip: ip, count: ipCount[ip] }
  })

  ipList.sort(function(a, b) { return b.count - a.count })

  let top5ips = ipList.slice(0, 5)

  top5ips.forEach(function(item, i) {
    console.log((i + 1) + '. ' + item.ip + '  —  ' + item.count + ' requests')
  })

  if (top5ips.length === 0) console.log('No data.')
  console.log('')

  console.log('==========================================')
  console.log('              END OF REPORT              ')
  console.log('==========================================')
  console.log('')
})