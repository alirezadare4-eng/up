import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);

const hasPort = args.some((arg) => arg === "--port" || arg === "-p" || arg.startsWith("--port="));
const port = process.env.PORT || "3000";

process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" && !hasPort ? ["--port", port] : []), ...args];
await import(cli.href);
