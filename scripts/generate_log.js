// This script generates a fake log file for testing
// Run it with: node scripts/generate_log.js
// It creates a file called sample.log in the project root

const fs = require('fs')
const path = require('path')

const outputFile = path.join(__dirname, '..', 'sample.log')

// sample data to pick from randomly
const ips = [
  '192.168.1.42', '10.0.0.7', '172.16.0.5',
  '192.168.1.100', '10.0.0.23', '203.0.113.10'
]

const methods = ['GET', 'POST', 'PUT', 'DELETE']

const paths = [
  '/api/users', '/api/login', '/api/products',
  '/api/orders', '/api/users/12', '/api/products/5',
  '/api/cart', '/api/checkout', '/health', '/'
]

const statusCodes = [200, 200, 200, 201, 301, 400, 401, 403, 404, 500, 502]

// helper: pick a random item from an array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// helper: random number between min and max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// helper: generate a normal log line
function normalLine(i) {
  let date = new Date(2024, 2, 15, 0, 0, i) // March 15 2024
  let timestamp = date.toISOString().replace('.000Z', 'Z')
  let ip     = randomItem(ips)
  let method = randomItem(methods)
  let urlPath = randomItem(paths)
  let status = randomItem(statusCodes)
  let time   = randomInt(10, 800) + 'ms'
  return timestamp + ' ' + ip + ' ' + method + ' ' + urlPath + ' ' + status + ' ' + time
}

// helper: different timestamp formats
function altTimestampLine(i) {
  let ip     = randomItem(ips)
  let method = randomItem(methods)
  let urlPath = randomItem(paths)
  let status = randomItem(statusCodes)
  let time   = (randomInt(10, 800) / 1000).toFixed(3) + 's' // response in seconds

  // pick a different timestamp format randomly
  let format = randomInt(1, 3)
  let timestamp

  if (format === 1) {
    // 2024/03/15 14:23:01
    timestamp = '2024/03/15 14:23:0' + (i % 10)
  } else if (format === 2) {
    // 15-Mar-2024 14:23:01
    timestamp = '15-Mar-2024 14:23:0' + (i % 10)
  } else {
    // Unix epoch
    timestamp = String(1710512581 + i)
  }

  return timestamp + ' ' + ip + ' ' + method + ' ' + urlPath + ' ' + status + ' ' + time
}

// helper: line with missing status code
function missingStatusLine(i) {
  let date = new Date(2024, 2, 15, 1, 0, i)
  let timestamp = date.toISOString().replace('.000Z', 'Z')
  let ip     = randomItem(ips)
  let method = randomItem(methods)
  let urlPath = randomItem(paths)
  let time   = randomInt(10, 800) + 'ms'
  return timestamp + ' ' + ip + ' ' + method + ' ' + urlPath + ' - ' + time
}

// helper: JSON line
function jsonLine() {
  return JSON.stringify({
    level: 'info',
    msg: 'server started',
    timestamp: '2024-03-15T14:00:00Z'
  })
}

// helper: completely malformed line
function malformedLine() {
  let options = [
    'ERROR: connection reset by peer',
    'at Object.<anonymous> (/app/server.js:42:5)',
    '   ',
    'null null null',
    '!!@#$%CORRUPTED_LINE##',
    ''
  ]
  return randomItem(options)
}

// helper: line with extra fields (user agent appended)
function extraFieldsLine(i) {
  let date = new Date(2024, 2, 15, 2, 0, i)
  let timestamp = date.toISOString().replace('.000Z', 'Z')
  let ip     = randomItem(ips)
  let method = randomItem(methods)
  let urlPath = randomItem(paths)
  let status = randomItem(statusCodes)
  let time   = randomInt(10, 800) + 'ms'
  let agent  = '"Mozilla/5.0 (Windows NT 10.0)"'
  return timestamp + ' ' + ip + ' ' + method + ' ' + urlPath + ' ' + status + ' ' + time + ' ' + agent
}

// ---- generate lines ----
let lines = []
let totalLines = 500

for (let i = 0; i < totalLines; i++) {
  let roll = randomInt(1, 100)

  if (roll <= 70) {
    // 70% normal lines
    lines.push(normalLine(i))
  } else if (roll <= 78) {
    // 8% different timestamp format
    lines.push(altTimestampLine(i))
  } else if (roll <= 83) {
    // 5% missing status
    lines.push(missingStatusLine(i))
  } else if (roll <= 87) {
    // 4% JSON lines
    lines.push(jsonLine())
  } else if (roll <= 93) {
    // 6% extra fields
    lines.push(extraFieldsLine(i))
  } else {
    // 7% malformed
    lines.push(malformedLine())
  }
}

fs.writeFileSync(outputFile, lines.join('\n') + '\n')
console.log('Generated ' + totalLines + ' lines -> ' + outputFile)