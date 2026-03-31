import { execSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const root = join(__dirname, "..")

function findProtoFiles(dir) {
	const results = []
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = join(dir, entry.name)
		if (entry.isDirectory()) {
			results.push(...findProtoFiles(fullPath))
		} else if (entry.name.endsWith(".proto")) {
			results.push(fullPath)
		}
	}
	return results
}

const bufBin = join(root, "node_modules", ".bin", process.platform === "win32" ? "buf.cmd" : "buf")

function runBuf(args) {
	return execSync([bufBin, ...args].join(" "), { cwd: root, stdio: "inherit" })
}

// 1. buf lint
try {
	runBuf(["lint"])
} catch {
	process.exit(1)
}

// 2. buf format -w --exit-code
try {
	runBuf(["format", "-w", "--exit-code"])
} catch {
	// buf format exits non-zero when files were formatted
	console.log("Proto files were formatted")
}

// 3. Check for RPC names with consecutive uppercase letters
// See https://github.com/cline/cline/pull/7054
const protoFiles = findProtoFiles(join(root, "proto"))
const pattern = /rpc\s+.*[A-Z][A-Z].*\(/
const violations = []

for (const file of protoFiles) {
	const content = readFileSync(file, "utf8")
	const lines = content.split("\n")
	for (let i = 0; i < lines.length; i++) {
		if (pattern.test(lines[i])) {
			violations.push(`${file}:${i + 1}:${lines[i].trim()}`)
		}
	}
}

if (violations.length > 0) {
	console.error("Error: Proto RPC names cannot contain repeated capital letters")
	for (const v of violations) {
		console.error(v)
	}
	process.exit(1)
}
