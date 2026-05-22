# ANSWERS.md

## 1. How to run

Only Node.js is required — no npm install, no dependencies.

**Generate test log file first:**
```
node scripts/generate_log.js
```

**Then run the analyzer:**
```
node analyzer.js sample.log
```

To run against any other file:
```
node analyzer.js path/to/logfile.log
```

---

## 2. Stack choice

**Stack: Node.js — plain JavaScript, no frameworks, no libraries.**

I chose Node.js because I am a JavaScript developer — I know it well and can write clean, readable code in it without fighting the language. The built-in `fs` and `readline` modules handle file reading efficiently even for large files (it reads line by line, so it never loads the entire file into memory at once). No npm install needed, which makes it easy for anyone to run.

**A worse choice would have been:** building this as a web app (Express + frontend). The task is about processing a file and printing a report — a CLI is the right tool. A web app would add unnecessary complexity: a server, HTML, routes, just to show text output.

---

## 3. One real edge case

**Edge case: response time in different units (ms vs seconds vs plain number)**

File: `analyzer.js`, function `parseResponseTime` (line 22)

The log file contains response times in three formats:
- `142ms` — milliseconds
- `0.142s` — seconds
- `142` — plain number with no unit

Without this handling, a line like `2024-03-15T14:23:01Z 192.168.1.42 GET /api/users 200 0.142s` would either crash or store `NaN` as the response time. The slowest endpoints report would then show wrong averages or skip those entries entirely.

The function checks what the string ends with — if it ends with `ms` it strips that and parses the number directly. If it ends with `s` it multiplies by 1000 to convert to milliseconds. If it's a plain number it parses it directly. This way all three formats end up as the same unit (ms) before being stored.

---

## 4. AI usage

I used Claude (claude.ai) for the following:

**a) Initial structure of analyzer.js** — I asked Claude to help build a log file parser in Node.js. It gave me a version that used `fs.readFileSync` which loads the entire file into memory at once. I changed this to `readline` with a stream (`fs.createReadStream`) because the assessment says files can be hundreds of thousands of lines — loading all that at once could crash on a low-memory machine. Reading line by line is the correct approach.

**b) The parseLine function** — Claude gave me a version that used a regex to parse each line. I changed it to a simple `line.split(' ')` approach because it is easier to read and understand. Since the fields are space-separated, splitting by space works fine. The regex was harder to follow and gave no real benefit for this task.

**c) The generate_log.js script** — I asked Claude to help write the generator. It initially made all malformed lines the same string. I changed it to have 6 different types of bad lines (stack traces, empty strings, corrupted text, null fields) to better match what real messy logs look like.

---

## 5. Honest gap

The `parseLine` function splits by space and assumes fields are at fixed positions. This works for most lines but breaks when a field itself contains a space — for example, a user agent string like `"Mozilla/5.0 (Windows NT 10.0; Win64)"` in the middle of the line would shift all field positions. Right now those lines either get counted as malformed or parsed incorrectly.

With another day I would improve the parser to handle quoted strings — anything inside quotes should be treated as one field even if it contains spaces. This would make the tool correctly parse lines with referrer URLs or user agent strings without misreading the status code or response time.