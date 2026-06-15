import { spawn } from "node:child_process";

const children: ReturnType<typeof spawn>[] = [];

function run(command: string, args: string[]) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    child.kill();
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("npx", ["tsx", "server/realtime-server.ts"]);
run("npx", ["next", "dev", "-p", "3030"]);

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });
}
