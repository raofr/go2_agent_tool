# GO2 Agent Tool Skill

## Purpose

Use this GO2 client tool to control GO2 through gRPC service only.

For OpenClaw, use Node.js CLI as first choice. Python is fallback only.

Current runtime architecture for media:

- Microphone receive: Python `go2_webrtc_connect` sidecar -> UDP bridge -> gRPC stream.
- Audio playback: gRPC upload -> Python `go2_webrtc_connect` sidecar (AudioHub API).
- Do not depend on C++ `webrtcbin` playback path.

## Download Source

Preferred:

- `https://github.com/raofr/go2_agent_tool`

Alternative:

- copy this directory as-is.

## Install

OpenClaw preferred (Node.js):

```bash
cd go2_agent_tool/node
npm install
```

Python fallback Option A (uv):

```bash
cd go2_agent_tool
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

Python fallback Option B (venv):

```bash
cd go2_agent_tool
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
python -m pip install -r requirements.txt
```

## Dependency Declaration

Required for OpenClaw-first path:

- Node.js >= 18
- npm
- `@grpc/grpc-js` and `@grpc/proto-loader` (installed by `npm install`)

Optional Python fallback:

- Python >= 3.10
- `grpcio`, `protobuf` from `requirements.txt`

## Service Precheck (must do before action)

OpenClaw preferred (Node.js):

```bash
cd node
node src/cli.js discover-endpoint --discovery-port 50052 --discovery-timeout-ms 5000 --prefer-ipv6
# record endpoint from JSON output, then:
node src/cli.js --endpoint "<DISCOVERED_ENDPOINT>" status
```

Python equivalent:

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 status
```

If RPC fails, ask operator to start server on dock host (`192.168.51.213`) first.

## Endpoint Configuration (Important)

Default endpoint is `192.168.51.213:50051`, but this may differ per network setup.

Preferred way: listen UDP discovery first, then use discovered endpoint.

Discovery is dual-stack:

- IPv4 broadcast + IPv6 multicast
- Node.js client listens on both
- Node.js client prefers IPv6 by default (`--prefer-ipv6`)

Node.js discovery command:

```bash
cd node
node src/cli.js discover-endpoint --discovery-port 50052 --discovery-timeout-ms 5000 --prefer-ipv6
```

Discovery JSON includes:

- `family` (`ipv6` or `ipv4`)
- `ip`
- `port`
- `endpoint` (`ip:port`)

Use `endpoint` value for all subsequent CLI calls.

For IPv6 endpoint, use bracket format:

```bash
node src/cli.js --endpoint "[fe80::1234:5678%en0]:50051" status
```

If endpoint is wrong, user must provide the actual dock host IP and update all CLI calls:

```bash
node src/cli.js --endpoint <REAL_DOCK_IP>:50051 status
```

Python fallback:

```bash
python -m go2_agent_tool.cli --endpoint <REAL_DOCK_IP>:50051 status
```

Before action calls, verify host connectivity:

```bash
ping -c 2 <REAL_DOCK_IP>
```

Proceed only when ping succeeds and `status` RPC is reachable.

## ActionName Full Enum List

Reference: Unitree sports services docs  
<https://support.unitree.com/home/zh/developer/sports_services?utm_source=chatgpt.com>

All supported values for `--action` with brief function and parameters:

- `ACTION_DAMP`: enter damping/relaxed state; no extra params.
- `ACTION_BALANCE_STAND`: switch to balance stand mode; no extra params.
- `ACTION_STOP_MOVE`: stop current movement command; no extra params.
- `ACTION_STAND_UP`: stand up; no extra params.
- `ACTION_STAND_DOWN`: stand down; no extra params.
- `ACTION_RECOVERY_STAND`: recovery stand (recommended pre-action init); no extra params.
- `ACTION_EULER`: body attitude control; required params: `roll`, `pitch`, `yaw`.
  - `roll` range: `[-0.75, 0.75]` rad
  - `pitch` range: `[-0.75, 0.75]` rad
  - `yaw` range: `[-0.6, 0.6]` rad
- `ACTION_MOVE`: velocity move control; required params: `vx`, `vy`, `vyaw`.
- `ACTION_SIT`: sit down; no extra params.
- `ACTION_RISE_SIT`: rise from sit posture; no extra params.
- `ACTION_SPEED_LEVEL`: switch speed level; required param: `level`.
- `ACTION_HELLO`: hello motion demo; no extra params.
- `ACTION_STRETCH`: stretch motion; no extra params.
- `ACTION_SWITCH_JOYSTICK`: switch joystick mode; optional param: `flag` (`true/false`).
- `ACTION_CONTENT`: content/happy motion; no extra params.
- `ACTION_HEART`: heart motion; no extra params.
- `ACTION_POSE`: pose motion; no extra params.
- `ACTION_SCRAPE`: scrape motion; no extra params.
- `ACTION_FRONT_FLIP`: front flip; no extra params.
- `ACTION_FRONT_JUMP`: front jump; no extra params.
- `ACTION_FRONT_POUNCE`: front pounce; no extra params.
- `ACTION_DANCE1`: dance preset 1; no extra params.
- `ACTION_DANCE2`: dance preset 2; no extra params.
- `ACTION_LEFT_FLIP`: left flip; no extra params.
- `ACTION_BACK_FLIP`: back flip; no extra params.
- `ACTION_HAND_STAND`: hand stand; optional param: `flag` (`true/false`).
- `ACTION_FREE_WALK`: free walk gait; no extra params.
- `ACTION_FREE_BOUND`: free bound gait; no extra params.
- `ACTION_FREE_JUMP`: free jump gait/mode; no extra params.
- `ACTION_FREE_AVOID`: free avoid mode; no extra params.
- `ACTION_CLASSIC_WALK`: classic walk gait; no extra params.
- `ACTION_WALK_UPRIGHT`: upright walk gait; no extra params.
- `ACTION_CROSS_STEP`: cross step gait; no extra params.
- `ACTION_AUTO_RECOVER_SET`: set auto recover switch; optional param: `flag` (`true/false`).
- `ACTION_AUTO_RECOVER_GET`: get auto recover status; no extra params (returns status in response).
- `ACTION_STATIC_WALK`: static walk gait; no extra params.
- `ACTION_TROT_RUN`: trot run gait; no extra params.
- `ACTION_ECONOMIC_GAIT`: economic gait mode; no extra params.
- `ACTION_SWITCH_AVOID_MODE`: switch obstacle avoid mode; optional param: `flag` (`true/false`).

## Default Task Policy

Important motion prerequisite:

- For most locomotion and posture actions, call `ACTION_RECOVERY_STAND` first after opening a session.
- If robot state is uncertain, run `ACTION_RECOVERY_STAND` again before sending the next complex action.

For each non-parallel task:

1. `node src/cli.js --endpoint 192.168.51.213:50051 force-close-owner --owner openclaw`
2. `node src/cli.js --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name <task_name>`
3. `node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_RECOVERY_STAND`
4. `node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action <ACTION_...>`
5. `node src/cli.js --endpoint 192.168.51.213:50051 close-session --session-id <id>`

For parallel task:

- open session with `--parallel`
- do not force-close owner sessions.

Node.js command template:

```bash
node src/cli.js --endpoint 192.168.51.213:50051 <subcommand ...>
```

## Action Parameter JSON Mapping

Machine-readable action constraints are provided at:

- `action_schema.json`

Use this file to drive tool/agent argument validation for `action` command.

- Base required fields: `session_id`, `action`
- Conditional required fields:
	- `ACTION_MOVE` -> `vx`, `vy`, `vyaw`
	- `ACTION_EULER` -> `roll`, `pitch`, `yaw`
	- `ACTION_SPEED_LEVEL` -> `level`
- `ACTION_EULER` value range:
	- `roll`: `[-0.75, 0.75]` rad
	- `pitch`: `[-0.75, 0.75]` rad
	- `yaw`: `[-0.6, 0.6]` rad
- Optional bool field (`flag`) allowed for:
	- `ACTION_SWITCH_JOYSTICK`, `ACTION_HAND_STAND`, `ACTION_AUTO_RECOVER_SET`, `ACTION_SWITCH_AVOID_MODE`
- All other actions: no extra parameters (only `session_id` + `action`).

## Minimal Smoke Test

```bash
node src/cli.js --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name smoke
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_RECOVERY_STAND
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_UP
node src/cli.js --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_DOWN
node src/cli.js --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

Python fallback uses equivalent `python -m go2_agent_tool.cli ...` commands.

## YOLO Detection Commands

Node.js (OpenClaw preferred):

```bash
cd go2_agent_tool/node
node src/cli.js --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name yolo
node src/cli.js --endpoint 192.168.51.213:50051 detect-once --session-id <id> --model-path /home/unitree/workspace/unitree_sdk2/models/yolo26/aarch64/yolo26s.engine
node src/cli.js --endpoint 192.168.51.213:50051 detect-start --session-id <id> --stream-id yolo-main --model-path /home/unitree/workspace/unitree_sdk2/models/yolo26/aarch64/yolo26s.engine --frame-skip 1 --fps-limit 5
node src/cli.js --endpoint 192.168.51.213:50051 detect-subscribe --session-id <id> --stream-id yolo-main
node src/cli.js --endpoint 192.168.51.213:50051 detect-stop --session-id <id> --stream-id yolo-main
node src/cli.js --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

Python fallback:

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 detect-once --session-id <id> --model-path /home/unitree/workspace/unitree_sdk2/models/yolo26/aarch64/yolo26s.engine
```

## Audio Commands

Node.js:

```bash
cd go2_agent_tool/node
node src/cli.js --endpoint 192.168.51.213:50051 --timeout 60 audio-upload-play --session-id <id> --stream-id audio-main --file /tmp/music_small.wav --mime audio/wav --sample-rate 16000 --channels 1 --volume 1.0
node src/cli.js --endpoint 192.168.51.213:50051 audio-status --session-id <id>
node src/cli.js --endpoint 192.168.51.213:50051 audio-stop --session-id <id> --stream-id audio-main
```

Audio notes:

- Prefer WAV/MP3 for playback bridge (`go2_webrtc_connect` AudioHub path).
- Keep upload file small (recommended <= 1 MB) to avoid gRPC message-size errors.
- If timeout occurs on upload, increase CLI `--timeout` (for example `--timeout 60`).

## Microphone Commands (Python bridge path)

Node.js:

```bash
cd go2_agent_tool/node
node src/cli.js --endpoint 192.168.51.213:50051 mic-start --session-id <id> --stream-id mic-main --sample-rate 48000 --channels 1
node src/cli.js --endpoint 192.168.51.213:50051 mic-subscribe --session-id <id> --stream-id mic-main
node src/cli.js --endpoint 192.168.51.213:50051 mic-stop --session-id <id> --stream-id mic-main
```

## Where To Put Files On Host Machine

Recommended host-side layout:

- Tool source repo: `C:/openclaw/tools/go2_agent_tool`
- Skill file: `C:/openclaw/skills/go2_agent_tool_skill.md`

If your OpenClaw installation uses custom directories, place `skill.md` into its configured `skills` directory and point tool command to the Python environment where this repo is installed.
