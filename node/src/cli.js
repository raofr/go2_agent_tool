#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
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
  console.log(`go2-agent-tool (node)\n\nUsage:\n  node src/cli.js [--endpoint host:port] [--timeout sec] <command> [args]\n\nCommands:\n  discover-endpoint [--discovery-port 50052] [--discovery-timeout-ms 5000] [--prefer-ipv6] [--ipv6-wait-ms 300]\n  status\n  open-session --owner <owner> [--session-name name] [--ttl-sec 30] [--parallel]\n  heartbeat --session-id <id>\n  close-session --session-id <id>\n  force-close-owner --owner <owner> [--keep-parallel-sessions]\n  action --session-id <id> --action <ACTION_...> [--vx n --vy n --vyaw n --roll n --pitch n --yaw n --level n --flag]\n  detect-once --session-id <id> [--model-path p --conf-thres f --iou-thres f --max-det n]\n  detect-start --session-id <id> [--stream-id id --model-path p --frame-skip n --fps-limit n]\n  detect-stop --session-id <id> --stream-id <id>\n  detect-subscribe --session-id <id> --stream-id <id>\n  audio-upload-play --session-id <id> --file <audio_file> [--stream-id id --mime audio/opus --sample-rate 48000 --channels 1 --volume 1.0 --loop --request-id id]\n  audio-status --session-id <id>\n  audio-stop --session-id <id> [--stream-id id]\n  mic-start --session-id <id> [--stream-id id --sample-rate 48000 --channels 1]\n  mic-stop --session-id <id> --stream-id <id>\n  mic-subscribe --session-id <id> --stream-id <id>\n\nAction enum count: ${ACTIONS.length}`);
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
    if (cmd === "discover-endpoint") {
      const resp = await client.discoverEndpoint({
        discoveryPort: Number(args["discovery-port"] || 50052),
        timeoutMs: Number(args["discovery-timeout-ms"] || 5000),
        preferIpv6: args["prefer-ipv6"] === undefined ? true : toBool(args["prefer-ipv6"]),
        ipv6WaitMs: Number(args["ipv6-wait-ms"] || 300),
      });
      console.log(JSON.stringify(resp));
      return;
    }

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

    if (cmd === "detect-once") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      const resp = await client.detectOnce({
        sessionId: args["session-id"],
        modelPath: args["model-path"] || "",
        confThres: Number(args["conf-thres"] || 0.25),
        iouThres: Number(args["iou-thres"] || 0.45),
        maxDet: Number(args["max-det"] || 100),
      });
      console.log(JSON.stringify(resp));
      return;
    }

    if (cmd === "detect-start") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      const resp = await client.startDetection({
        sessionId: args["session-id"],
        streamId: args["stream-id"] || "",
        modelPath: args["model-path"] || "",
        confThres: Number(args["conf-thres"] || 0.25),
        iouThres: Number(args["iou-thres"] || 0.45),
        maxDet: Number(args["max-det"] || 100),
        frameSkip: Number(args["frame-skip"] || 0),
        fpsLimit: Number(args["fps-limit"] || 5),
      });
      console.log(JSON.stringify({ stream_id: resp.stream_id }));
      return;
    }

    if (cmd === "detect-stop") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      if (!args["stream-id"]) throw new Error("--stream-id is required");
      const resp = await client.stopDetection({
        sessionId: args["session-id"],
        streamId: args["stream-id"],
      });
      console.log(JSON.stringify({ stopped: Boolean(resp.stopped) }));
      return;
    }

    if (cmd === "detect-subscribe") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      if (!args["stream-id"]) throw new Error("--stream-id is required");
      await new Promise((resolve, reject) => {
        client.subscribeDetections({
          sessionId: args["session-id"],
          streamId: args["stream-id"],
          onEvent: (event) => console.log(JSON.stringify(event)),
          onError: (err) => reject(err),
          onEnd: () => resolve(),
        });
      });
      return;
    }

    if (cmd === "audio-upload-play") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      if (!args.file) throw new Error("--file is required");
      const audio = fs.readFileSync(args.file);
      const resp = await client.uploadAndPlayAudio({
        sessionId: args["session-id"],
        streamId: args["stream-id"] || "",
        audioBytes: audio,
        mime: args.mime || "audio/opus",
        sampleRate: Number(args["sample-rate"] || 48000),
        channels: Number(args.channels || 1),
        volume: Number(args.volume || 1.0),
        loop: toBool(args.loop),
        requestId: args["request-id"] || "",
      });
      console.log(
        JSON.stringify({
          stream_id: resp.stream_id || "",
          request_id: resp.request_id || "",
          accepted: Boolean(resp.accepted),
        })
      );
      return;
    }

    if (cmd === "audio-status") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      const resp = await client.getAudioStatus({ sessionId: args["session-id"] });
      console.log(
        JSON.stringify({
          connected: Boolean(resp.connected),
          playing: Boolean(resp.playing),
          stream_id: resp.stream_id || "",
          queued_items: Number(resp.queued_items || 0),
          last_error_ts_ms: Number(resp.last_error_ts_ms || 0),
          last_error: resp.last_error || "",
        })
      );
      return;
    }

    if (cmd === "audio-stop") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      const resp = await client.stopAudioPlayback({
        sessionId: args["session-id"],
        streamId: args["stream-id"] || "",
      });
      console.log(JSON.stringify({ stopped: Boolean(resp.stopped) }));
      return;
    }

    if (cmd === "mic-start") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      const resp = await client.startMicrophone({
        sessionId: args["session-id"],
        streamId: args["stream-id"] || "",
        sampleRate: Number(args["sample-rate"] || 48000),
        channels: Number(args.channels || 1),
      });
      console.log(JSON.stringify({ stream_id: resp.stream_id || "" }));
      return;
    }

    if (cmd === "mic-stop") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      if (!args["stream-id"]) throw new Error("--stream-id is required");
      const resp = await client.stopMicrophone({
        sessionId: args["session-id"],
        streamId: args["stream-id"],
      });
      console.log(JSON.stringify({ stopped: Boolean(resp.stopped) }));
      return;
    }

    if (cmd === "mic-subscribe") {
      if (!args["session-id"]) throw new Error("--session-id is required");
      if (!args["stream-id"]) throw new Error("--stream-id is required");
      await new Promise((resolve, reject) => {
        client.subscribeMicrophone({
          sessionId: args["session-id"],
          streamId: args["stream-id"],
          onAudio: (audio) => console.log(JSON.stringify({
            stream_id: audio.stream_id || "",
            timestamp_ms: Number(audio.timestamp_ms || 0),
            is_silence: Boolean(audio.is_silence),
            audio_data_len: audio.audio_data ? audio.audio_data.length : 0,
          })),
          onError: (err) => reject(err),
          onEnd: () => resolve(),
        });
      });
      return;
    }

    throw new Error(`unknown command: ${cmd}`);
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(2);
  }
}

main();
