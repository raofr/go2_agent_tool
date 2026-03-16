# GO2 Agent Tool Skill

## Purpose

Use this Python client tool to control GO2 through gRPC service only.

## Download Source

Preferred:

- `https://github.com/raofr/go2_agent_tool`

Alternative:

- copy this directory as-is.

## Install

Option A (uv, recommended):

```bash
cd go2_agent_tool
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

Option B (venv):

```bash
cd go2_agent_tool
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
python -m pip install -r requirements.txt
```

## Service Precheck (must do before action)

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 status
```

If RPC fails, ask operator to start server on dock host (`192.168.51.213`) first.

## Endpoint Configuration (Important)

Default endpoint is `192.168.51.213:50051`, but this may differ per network setup.

If endpoint is wrong, user must provide the actual dock host IP and update all CLI calls:

```bash
python -m go2_agent_tool.cli --endpoint <REAL_DOCK_IP>:50051 status
```

Before action calls, verify host connectivity:

```bash
ping -c 2 <REAL_DOCK_IP>
```

Proceed only when ping succeeds and `status` RPC is reachable.

## ActionName Full Enum List

All supported values for `--action`:

- ACTION_DAMP
- ACTION_BALANCE_STAND
- ACTION_STOP_MOVE
- ACTION_STAND_UP
- ACTION_STAND_DOWN
- ACTION_RECOVERY_STAND
- ACTION_EULER
- ACTION_MOVE
- ACTION_SIT
- ACTION_RISE_SIT
- ACTION_SPEED_LEVEL
- ACTION_HELLO
- ACTION_STRETCH
- ACTION_SWITCH_JOYSTICK
- ACTION_CONTENT
- ACTION_HEART
- ACTION_POSE
- ACTION_SCRAPE
- ACTION_FRONT_FLIP
- ACTION_FRONT_JUMP
- ACTION_FRONT_POUNCE
- ACTION_DANCE1
- ACTION_DANCE2
- ACTION_LEFT_FLIP
- ACTION_BACK_FLIP
- ACTION_HAND_STAND
- ACTION_FREE_WALK
- ACTION_FREE_BOUND
- ACTION_FREE_JUMP
- ACTION_FREE_AVOID
- ACTION_CLASSIC_WALK
- ACTION_WALK_UPRIGHT
- ACTION_CROSS_STEP
- ACTION_AUTO_RECOVER_SET
- ACTION_AUTO_RECOVER_GET
- ACTION_STATIC_WALK
- ACTION_TROT_RUN
- ACTION_ECONOMIC_GAIT
- ACTION_SWITCH_AVOID_MODE

## Default Task Policy

For each non-parallel task:

1. `python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 force-close-owner --owner openclaw`
2. `python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name <task_name>`
3. `python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action <ACTION_...>`
4. `python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 close-session --session-id <id>`

For parallel task:

- open session with `--parallel`
- do not force-close owner sessions.

## Action Parameter JSON Mapping

Machine-readable action constraints are provided at:

- `action_schema.json`

Use this file to drive tool/agent argument validation for `action` command.

- Base required fields: `session_id`, `action`
- Conditional required fields:
	- `ACTION_MOVE` -> `vx`, `vy`, `vyaw`
	- `ACTION_EULER` -> `roll`, `pitch`, `yaw`
	- `ACTION_SPEED_LEVEL` -> `level`
- Optional bool field (`flag`) allowed for:
	- `ACTION_SWITCH_JOYSTICK`, `ACTION_HAND_STAND`, `ACTION_AUTO_RECOVER_SET`, `ACTION_SWITCH_AVOID_MODE`

## Minimal Smoke Test

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name smoke
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_UP
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_DOWN
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

## Where To Put Files On Host Machine

Recommended host-side layout:

- Tool source repo: `C:/openclaw/tools/go2_agent_tool`
- Skill file: `C:/openclaw/skills/go2_agent_tool_skill.md`

If your OpenClaw installation uses custom directories, place `skill.md` into its configured `skills` directory and point tool command to the Python environment where this repo is installed.
