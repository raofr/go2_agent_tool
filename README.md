# go2_agent_tool

Standalone Python gRPC client tool for GO2 sport service.

## Install

From local folder:

```bash
pip install -r requirements.txt
```

From GitHub (after you publish):

```bash
pip install "git+https://github.com/raofr/go2_agent_tool.git"
```

## CLI Usage

```bash
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 status
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 open-session --owner openclaw --session-name default
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_UP
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 action --session-id <id> --action ACTION_STAND_DOWN
python -m go2_agent_tool.cli --endpoint 192.168.51.213:50051 close-session --session-id <id>
```

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

- `go2_agent_tool/client.py`
- `go2_agent_tool/cli.py`
- `go2_agent_tool/generated/go2_sport_pb2.py`
- `go2_agent_tool/generated/go2_sport_pb2_grpc.py`
- `requirements.txt`
- `skill.md`
