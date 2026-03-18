# go2_agent_tool

Standalone GO2 gRPC client toolkit with both Python and Node.js CLIs.

For OpenClaw deployments, prefer the Node.js version by default (OpenClaw environments usually already have Node.js).

## Dependencies

- Node.js >= 18 and npm (preferred for OpenClaw)
- Node packages: `@grpc/grpc-js`, `@grpc/proto-loader` (installed by `npm install` in `node/`)
- Python >= 3.10 (optional fallback)
- Python packages: `grpcio`, `protobuf` (from `requirements.txt`)

## Install

OpenClaw preferred install (Node.js):

```bash
cd node
npm install
```

Python fallback install:

```bash
pip install -r requirements.txt
```

From GitHub (after you publish):

```bash
pip install "git+https://github.com/raofr/go2_agent_tool.git"
```

Node.js CLI from cloned repo (recommended for OpenClaw):

```bash
cd go2_agent_tool/node
node src/cli.js --endpoint 192.168.51.213:50051 status
```

## Auto-discover Go2 Endpoint (UDP)

`go2_sport_grpc_server` now sends dual-stack UDP discovery packets every second on port `50052`:

- IPv4 broadcast (`255.255.255.255`)
- IPv6 multicast (`ff02::1`, link-local scope)

Node.js client listens on both `udp4` and `udp6`, and prefers IPv6 by default (falls back to IPv4):

```bash
cd go2_agent_tool/node
node src/cli.js discover-endpoint --discovery-port 50052 --discovery-timeout-ms 5000 --prefer-ipv6
```

Example output:

```json
{"service":"go2_sport_grpc","family":"ipv6","ip":"fe80::1234:5678%en0","port":50051,"endpoint":"[fe80::1234:5678%en0]:50051","senderIp":"fe80::1234:5678","discoveredAtMs":1710000000000}
```

Then use the discovered endpoint in other commands:

```bash
node src/cli.js --endpoint "[fe80::1234:5678%en0]:50051" status
```

## CLI Usage

OpenClaw recommended (Node.js):

```bash
cd node
node src/cli.js --endpoint 192.168.51.213:50051 status
node src/cli.js --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name default
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_RECOVERY_STAND
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_UP
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_DOWN
node src/cli.js --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

YOLO detection (Node.js):

```bash
cd node
node src/cli.js --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name yolo
node src/cli.js --endpoint 192.168.51.213:50051 detect-once --session-id <id> --model-path /home/unitree/workspace/unitree_sdk2/models/yolo26/aarch64/yolo26s.engine
node src/cli.js --endpoint 192.168.51.213:50051 detect-start --session-id <id> --stream-id yolo-main --model-path /home/unitree/workspace/unitree_sdk2/models/yolo26/aarch64/yolo26s.engine --frame-skip 1 --fps-limit 5
node src/cli.js --endpoint 192.168.51.213:50051 detect-subscribe --session-id <id> --stream-id yolo-main
node src/cli.js --endpoint 192.168.51.213:50051 detect-stop --session-id <id> --stream-id yolo-main
node src/cli.js --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

Audio (Node.js):

```bash
cd node
node src/cli.js --endpoint 192.168.51.213:50051 audio-upload-play --session-id <id> --stream-id audio-main --file /tmp/beep.opus --mime audio/opus --sample-rate 48000 --channels 1 --volume 1.0
node src/cli.js --endpoint 192.168.51.213:50051 audio-status --session-id <id>
node src/cli.js --endpoint 192.168.51.213:50051 audio-stop --session-id <id> --stream-id audio-main
```

Python equivalent:

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 status
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name default
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_RECOVERY_STAND
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_UP
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_DOWN
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

YOLO detection (Python):

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name yolo
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 detect-once --session-id <id> --model-path /home/unitree/workspace/unitree_sdk2/models/yolo26/aarch64/yolo26s.engine
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 detect-start --session-id <id> --stream-id yolo-main --model-path /home/unitree/workspace/unitree_sdk2/models/yolo26/aarch64/yolo26s.engine --frame-skip 1 --fps-limit 5
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 detect-subscribe --session-id <id> --stream-id yolo-main
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 detect-stop --session-id <id> --stream-id yolo-main
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

## OpenClaw Recommendation

- First choice: Node.js CLI in `node/`
- Fallback only: Python CLI in repo root

Reason: OpenClaw runtime usually already has Node.js installed.

## Runtime Contract For Agents

Default non-parallel flow:

1. force-close-owner --owner openclaw
2. open-session --owner openclaw --session-name <task>
3. action --session-id <id> --action ACTION_RECOVERY_STAND
4. action --session-id <id> --action <ACTION_...>
5. close-session --session-id <id>

Important note: many motion actions should run only after ACTION_RECOVERY_STAND is executed in the same session.

Parallel flow:

- open-session ... --parallel
- do not force-close owner sessions

## Files Included

- `node/` (Node.js CLI implementation)
- `go2_agent_tool/client.py`
- `go2_agent_tool/cli.py`
- `go2_agent_tool/generated/go2_sport_pb2.py`
- `go2_agent_tool/generated/go2_sport_pb2_grpc.py`
- `requirements.txt`
- `skill.md`
