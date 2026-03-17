const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = path.resolve(__dirname, "../proto/go2_sport.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition).go2.sport.v1;

const ACTIONS = [
  "ACTION_DAMP",
  "ACTION_BALANCE_STAND",
  "ACTION_STOP_MOVE",
  "ACTION_STAND_UP",
  "ACTION_STAND_DOWN",
  "ACTION_RECOVERY_STAND",
  "ACTION_EULER",
  "ACTION_MOVE",
  "ACTION_SIT",
  "ACTION_RISE_SIT",
  "ACTION_SPEED_LEVEL",
  "ACTION_HELLO",
  "ACTION_STRETCH",
  "ACTION_SWITCH_JOYSTICK",
  "ACTION_CONTENT",
  "ACTION_HEART",
  "ACTION_POSE",
  "ACTION_SCRAPE",
  "ACTION_FRONT_FLIP",
  "ACTION_FRONT_JUMP",
  "ACTION_FRONT_POUNCE",
  "ACTION_DANCE1",
  "ACTION_DANCE2",
  "ACTION_LEFT_FLIP",
  "ACTION_BACK_FLIP",
  "ACTION_HAND_STAND",
  "ACTION_FREE_WALK",
  "ACTION_FREE_BOUND",
  "ACTION_FREE_JUMP",
  "ACTION_FREE_AVOID",
  "ACTION_CLASSIC_WALK",
  "ACTION_WALK_UPRIGHT",
  "ACTION_CROSS_STEP",
  "ACTION_AUTO_RECOVER_SET",
  "ACTION_AUTO_RECOVER_GET",
  "ACTION_STATIC_WALK",
  "ACTION_TROT_RUN",
  "ACTION_ECONOMIC_GAIT",
  "ACTION_SWITCH_AVOID_MODE",
];

class Go2SportClient {
  constructor(endpoint = "127.0.0.1:50051", timeoutSec = 5.0) {
    this.endpoint = endpoint;
    this.timeoutMs = Math.floor(Number(timeoutSec) * 1000);
    this.client = new proto.Go2SportService(endpoint, grpc.credentials.createInsecure());
  }

  _deadline() {
    return new Date(Date.now() + this.timeoutMs);
  }

  _call(method, request) {
    return new Promise((resolve, reject) => {
      this.client[method](request, { deadline: this._deadline() }, (err, resp) => {
        if (err) {
          reject(err);
          return;
        }
        if (resp.code !== 0) {
          reject(new Error(`gRPC request failed code=${resp.code}: ${resp.message}`));
          return;
        }
        resolve(resp);
      });
    });
  }

  openSession({ owner, sessionName = "", ttlSec = 30, parallel = false }) {
    return this._call("OpenSession", {
      owner,
      session_name: sessionName,
      ttl_sec: Number(ttlSec),
      parallel: Boolean(parallel),
    });
  }

  heartbeat({ sessionId }) {
    return this._call("Heartbeat", { session_id: sessionId });
  }

  closeSession({ sessionId }) {
    return this._call("CloseSession", { session_id: sessionId });
  }

  forceCloseOwnerSessions({ owner, keepParallelSessions = false }) {
    return this._call("ForceCloseOwnerSessions", {
      owner,
      keep_parallel_sessions: Boolean(keepParallelSessions),
    });
  }

  executeAction({
    sessionId,
    action,
    vx = 0,
    vy = 0,
    vyaw = 0,
    roll = 0,
    pitch = 0,
    yaw = 0,
    level = 0,
    flag = false,
  }) {
    if (!ACTIONS.includes(action)) {
      throw new Error(`unsupported action: ${action}`);
    }
    return this._call("ExecuteAction", {
      session_id: sessionId,
      action,
      vx: Number(vx),
      vy: Number(vy),
      vyaw: Number(vyaw),
      roll: Number(roll),
      pitch: Number(pitch),
      yaw: Number(yaw),
      level: Number(level),
      flag: Boolean(flag),
    });
  }

  getServerStatus() {
    return this._call("GetServerStatus", {});
  }

  detectOnce({
    sessionId,
    modelPath = "",
    confThres = 0.25,
    iouThres = 0.45,
    maxDet = 100,
  }) {
    return this._call("DetectObjects", {
      session_id: sessionId,
      model_path: modelPath,
      conf_thres: Number(confThres),
      iou_thres: Number(iouThres),
      max_det: Number(maxDet),
    });
  }

  startDetection({
    sessionId,
    streamId = "",
    modelPath = "",
    confThres = 0.25,
    iouThres = 0.45,
    maxDet = 100,
    frameSkip = 0,
    fpsLimit = 5,
  }) {
    return this._call("StartDetection", {
      session_id: sessionId,
      stream_id: streamId,
      model_path: modelPath,
      conf_thres: Number(confThres),
      iou_thres: Number(iouThres),
      max_det: Number(maxDet),
      frame_skip: Number(frameSkip),
      fps_limit: Number(fpsLimit),
    });
  }

  stopDetection({ sessionId, streamId }) {
    return this._call("StopDetection", {
      session_id: sessionId,
      stream_id: streamId,
    });
  }

  subscribeDetections({ sessionId, streamId, onEvent, onError, onEnd }) {
    const stream = this.client.SubscribeDetections({
      session_id: sessionId,
      stream_id: streamId,
    });
    stream.on("data", (event) => {
      if (typeof onEvent === "function") onEvent(event);
    });
    stream.on("error", (err) => {
      if (typeof onError === "function") onError(err);
    });
    stream.on("end", () => {
      if (typeof onEnd === "function") onEnd();
    });
    return stream;
  }

  uploadAndPlayAudio({
    sessionId,
    streamId = "",
    audioBytes,
    mime = "audio/opus",
    sampleRate = 48000,
    channels = 1,
    volume = 1.0,
    loop = false,
    requestId = "",
  }) {
    return this._call("UploadAndPlayAudio", {
      session_id: sessionId,
      stream_id: streamId,
      audio_bytes: audioBytes,
      mime,
      sample_rate: Number(sampleRate),
      channels: Number(channels),
      volume: Number(volume),
      loop: Boolean(loop),
      request_id: requestId,
    });
  }

  getAudioStatus({ sessionId }) {
    return this._call("GetAudioStatus", {
      session_id: sessionId,
    });
  }

  stopAudioPlayback({ sessionId, streamId = "" }) {
    return this._call("StopAudioPlayback", {
      session_id: sessionId,
      stream_id: streamId,
    });
  }
}

module.exports = {
  Go2SportClient,
  ACTIONS,
};
