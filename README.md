# Log Analyzer

A CLI tool that reads a server log file and prints a useful summary report — total requests, status code breakdown, slowest endpoints, and most active IPs. Handles messy/malformed lines gracefully without crashing.

## Project Structure

```
log-analyzer/
├── analyzer.js              # main tool
├── scripts/
│   └── generate_log.js      # generates a test log file
├── sample.log               # generated test file (run generator first)
├── README.md
└── ANSWERS.md
```

## How to run

No install needed — only requires Node.js.

**Step 1 — Generate a test log file**

```
node scripts/generate_log.js
```

This creates `sample.log` in the project root with 500 lines including malformed lines, different timestamp formats, JSON lines, and missing fields.

**Step 2 — Run the analyzer**

```
node analyzer.js sample.log
```

You can also point it at any other log file:

```
node analyzer.js path/to/any/logfile.log
```

## Example Output

```
==========================================
         LOG ANALYZER — REPORT
==========================================
File: sample.log

--- General Stats ---
Total lines in file : 500
Total valid requests: 412
Malformed lines     : 31

--- Status Code Breakdown ---
2xx (Success)   : 290
3xx (Redirect)  : 18
4xx (Client err): 72
5xx (Server err): 32

--- Top 5 Slowest Endpoints (avg response time) ---
1. /api/checkout
   Avg: 743.20ms  |  Requests: 12
2. /api/orders
   Avg: 698.50ms  |  Requests: 18
...

--- Top 5 Most Active IPs ---
1. 192.168.1.42  —  89 requests
2. 10.0.0.7      —  76 requests
...
==========================================
              END OF REPORT
==========================================
```