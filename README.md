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

## CLI Usage

OpenClaw recommended (Node.js):

```bash
cd node
node src/cli.js --endpoint 192.168.51.213:50051 status
node src/cli.js --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name default
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_UP
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_DOWN
node src/cli.js --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

Python equivalent:

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 status
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name default
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_UP
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_DOWN
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
3. action --session-id <id> --action <ACTION_...>
4. close-session --session-id <id>

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
