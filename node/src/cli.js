#!/usr/bin/env node
/* eslint-disable no-console */
const { Go2SportClient, ACTIONS } = require("./client");

function parseArgs(argv) {
  const out = {
    _: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const cur = argv[i];
    if (!cur.startsWith("--")) {
      out._.push(cur);
      continue;
    }
    const key = cur.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v !== "string") return false;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function usage() {
  console.log(`go2-agent-tool (node)\n\nUsage:\n  node src/cli.js [--endpoint host:port] [--timeout sec] <command> [args]\n\nCommands:\n  status\n  open-session --owner <owner> [--session-name name] [--ttl-sec 30] [--parallel]\n  heartbeat --session-id <id>\n  close-session --session-id <id>\n  force-close-owner --owner <owner> [--keep-parallel-sessions]\n  action --session-id <id> --action <ACTION_...> [--vx n --vy n --vyaw n --roll n --pitch n --yaw n --level n --flag]\n\nAction enum count: ${ACTIONS.length}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || cmd === "help" || cmd === "--help") {
    usage();
    process.exit(0);
  }

  const endpoint = args.endpoint || "127.0.0.1:50051";
  const timeout = Number(args.timeout || 5);
  const client = new Go2SportClient(endpoint, timeout);

  try {
    if (cmd === "status") {
      const resp = await client.getServerStatus();
      console.log(JSON.stringify(resp));
      return;
    }

    if (cmd === "open-session") {
      if (!args.owner) throw new Error("--owner is required");
      const resp = await client.openSession({
        owner: args.owner,
        sessionName: args["session-name"] || "",
        ttlSec: Number(args["ttl-sec"] || 30),
        parallel: toBool(args.parallel),
      });
      console.log(JSON.stringify({ session_id: resp.session_id, expires_at_ms: resp.expires_at_ms }));
      return;
    }

    if (cmd === "heartbeat") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      const resp = await client.heartbeat({ sessionId: args["session-id"] });
      console.log(JSON.stringify({ expires_at_ms: resp.expires_at_ms }));
      return;
    }

    if (cmd === "close-session") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      await client.closeSession({ sessionId: args["session-id"] });
      console.log(JSON.stringify({ ok: true }));
      return;
    }

    if (cmd === "force-close-owner") {
      if (!args.owner) throw new Error("--owner is required");
      const resp = await client.forceCloseOwnerSessions({
        owner: args.owner,
        keepParallelSessions: toBool(args["keep-parallel-sessions"]),
      });
      console.log(JSON.stringify({ closed_count: Number(resp.closed_count || 0) }));
      return;
    }

    if (cmd === "action") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      if (!args.action) throw new Error("--action is required");
      const resp = await client.executeAction({
        sessionId: args["session-id"],
        action: args.action,
        vx: Number(args.vx || 0),
        vy: Number(args.vy || 0),
        vyaw: Number(args.vyaw || 0),
        roll: Number(args.roll || 0),
        pitch: Number(args.pitch || 0),
        yaw: Number(args.yaw || 0),
        level: Number(args.level || 0),
        flag: toBool(args.flag),
      });
      console.log(
        JSON.stringify({
          code: Number(resp.code || 0),
          message: resp.message || "",
          sdk_code: Number(resp.sdk_code || 0),
          bool_value: Boolean(resp.bool_value),
        })
      );
      return;
    }

    throw new Error(`unknown command: ${cmd}`);
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(2);
  }
}

main();
