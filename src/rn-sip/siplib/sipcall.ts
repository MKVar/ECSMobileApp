import {
  RTCPeerConnection,
  // @ts-ignore
  RTCIceCandidate,
  // @ts-ignore
  RTCSessionDescription,
  // @ts-ignore
  RTCView,
  MediaStream,
  MediaStreamTrack,
  // @ts-ignore
  mediaDevices,
  // @ts-ignore
  registerGlobals,
} from "react-native-webrtc";
import * as JsSIP from "react-native-jssip";
import * as EventEmitter from "events";
import * as sdpTransform from "sdp-transform";
import { RTCSession } from "react-native-jssip/lib/RTCSession";
import dummyLogger from "../lib/dummyLogger";
import {
  CALL_STATUS_IDLE,
  CALL_STATUS_ACTIVE,
  CALL_STATUS_CONNECTING,
  CALL_STATUS_DIALING,
  CALL_STATUS_PROGRESS,
  CALL_STATUS_RINGING,
  CALL_STATUS_TERMINATING,
  CallStatus,
  MEDIA_DEVICE_STATUS_ACTIVE,
  MEDIA_DEVICE_STATUS_MUTE,
  MediaDeviceStatus,
  MEDIA_SESSION_STATUS_IDLE,
  MEDIA_SESSION_STATUS_ACTIVE,
  MEDIA_SESSION_STATUS_INACTIVE,
  MEDIA_SESSION_STATUS_RECVONLY,
  MEDIA_SESSION_STATUS_SENDONLY,
  MediaSessionStatus,
  CALL_DIRECTION_INCOMING,
  CALL_DIRECTION_OUTGOING,
  CallDirection,
  TRANSFER_STATUS_NONE,
  TRANSFER_STATUS_INITIATED,
  TRANSFER_STATUS_REFER_SUCCESS,
  TRANSFER_STATUS_FAILED,
  TRANSFER_STATUS_COMPLETE,
  TransferStatus,
  SDP_OFFER_PENDING,
  SDP_OFFER_RECEIVED,
  SDP_OFFER_ANSWER_COMPLETE,
  SdpOfferAnswerStatus,
} from "../lib/enums";
import { SipExtraHeaders } from "./sipua";

import { Logger, AppCallEventHandler } from "../lib/types";
import { DTMF_TRANSPORT } from "react-native-jssip/lib/Constants";
import { MediaEngine } from "../medialib/mediaengine";

export interface SipCallConfig {
  extraHeaders: SipExtraHeaders;
  sessionTimerExpires: number;
  getSetting: any;
}

export interface DtmfOptions {
  duration: number;
  interToneGap: number;
  channelType: DTMF_TRANSPORT | undefined;
}

export interface PayloadInfo {
  num: number;
  codec: string;
  params: string;
}

export interface SdpMediaInfo {
  // Media type 'audio' or 'video'
  type: string;
  // 'sendrecv', 'recvonly', 'sendonly', 'inactive'
  mode: string;
  payloads: PayloadInfo[];
}

export class SipCall {
  _id: string;
  _callStatus: CallStatus;
  _rtcSession: RTCSession | null;
  _callConfig: SipCallConfig;
  _rtcConfig: RTCConfiguration;
  _dtmfOptions: DtmfOptions;
  _appParams: object;
  _mediaSessionStatus: MediaSessionStatus;
  _mediaDeviceStatus: {
    audio: MediaDeviceStatus;
    video: MediaDeviceStatus;
  };
  _transferStatus: TransferStatus;
  _logger: Logger;
  _debug: boolean;
  _debugNamespaces?: string;
  // Media Streams
  _inputMediaStream: MediaStream | null;
  _outputMediaStream: MediaStream | null;
  _peerConnection: RTCPeerConnection | null;
  _mediaEngine: MediaEngine; // Media Engine instance
  _eventEmitter: EventEmitter;
  // call variables
  _endType: "hangup" | "failure" | "none";
  _errorCause: string;
  _isPlaying: boolean;
  _direction: CallDirection;
  _hasAnswered: boolean;  // missed call
  _hasLocalVideo: boolean;
  _hasRemoteVideo: boolean;
  // Media information
  _sdpStatus: SdpOfferAnswerStatus;
  _localMedia: SdpMediaInfo[];
  _remoteMedia: SdpMediaInfo[];
  _modifySdp: boolean; // flag to denote SDP needs to be modified
  // Currently not used
  // Used only for SDP manipulation testing
  _audioCodecs: string[]; // audio codecs for the call
  _videoCodecs: string[]; // video codecs for the call
  _tones: any;
  _appEventHandler: AppCallEventHandler | null;
  _shareScreen: boolean;
  // instance access
  startTime: string | undefined;
  endTime: string | undefined;
  remoteUri: string;
  remoteName: string;
  remoteIdentity: any;
  remoteUser: string;
  _durTimerId: any;
  _durMin: number;
  _durSec: number;
  _durListeners: any;

  constructor(
    callId: string,
    isIncoming: boolean,
    remoteName: string,
    remoteIdentity: any,
    callConfig: SipCallConfig,
    rtcConfig: RTCConfiguration,
    mediaEngine: MediaEngine,
    eventEmitter: EventEmitter,
    appParams: object,
    debug: boolean
  ) {
    this._debug = debug;
    this._rtcSession = null;
    this._callConfig = callConfig;
    this._rtcConfig = rtcConfig;
    this._mediaEngine = mediaEngine;
    this._eventEmitter = eventEmitter;
    this.remoteIdentity = remoteIdentity;
    this.remoteName = remoteName;
    this.remoteUri = "";
    this._endType = "none";
    this._errorCause = "";
    this._id = callId || this._uuid(); // potentially gathered for "incoming-call"
    this._isPlaying = false;
    this._hasAnswered = false;
    this._transferStatus = TRANSFER_STATUS_NONE;
    this._hasLocalVideo = false;
    this._hasRemoteVideo = false;
    this._sdpStatus = SDP_OFFER_PENDING;
    this._localMedia = [];
    this._remoteMedia = [];
    this._inputMediaStream = null;
    this._outputMediaStream = null;
    this._appParams = appParams;
    this._shareScreen = false;
    this._dtmfOptions = {
      duration: 100,
      interToneGap: 500,
      channelType: DTMF_TRANSPORT.INFO, // INFO based
    };
    // configurable parameters
    this._modifySdp = false;
    this._audioCodecs = [
      "OPUS", // base, should not comment out?
      "G722",
      "PCMA",
      "PCMU",
      "telephone-event",
      "CN",
    ];
    this._videoCodecs = ["VP8"];
    this._tones = {};
    this._appEventHandler = null;
    this._init(isIncoming);
    this._eventEmitter.on("video.input.update", this._videoInputUpdateListener);
    this._durTimerId = 0;
    this._durMin = 0;
    this._durSec = 0;
    this._durListeners = {};
  }

  _init = (isIncoming: boolean): void => {
    if (isIncoming === true) {
      this.setCallStatus(CALL_STATUS_RINGING);
      this._direction = CALL_DIRECTION_INCOMING;
      this._mediaEngine.startRingTone();
    } else {
      console.log("SIP Call created for outgoing");
      this.remoteUser = this.remoteName;
      this.setCallStatus(CALL_STATUS_DIALING);
      this._direction = CALL_DIRECTION_OUTGOING;
    }
    this._configureDebug();
    this._mediaSessionStatus = MEDIA_SESSION_STATUS_IDLE;
    this._mediaDeviceStatus = {
      audio: MEDIA_DEVICE_STATUS_ACTIVE,
      video: MEDIA_DEVICE_STATUS_ACTIVE,
    };
    this._outputMediaStream = new MediaStream();
  };
  getId = (): string => {
    return this._id;
  };
  getAppParams = (): object => {
    return this._appParams;
  };
  getExtraHeaders = (): SipExtraHeaders => {
    return this._callConfig.extraHeaders;
  };
  getSessionTimerExpires = (): number => {
    return this._callConfig.sessionTimerExpires;
  };
  setRTCSession = (rtcSession: RTCSession): void => {
    this._rtcSession = rtcSession;
  };
  getRTCSession = (): RTCSession | null => {
    return this._rtcSession;
  };
  isSessionActive = (): boolean => {
    return this._rtcSession != null;
  };
  getCallStatus = (): CallStatus => {
    return this._callStatus;
  };
  setCallStatus = (status: CallStatus): void => {
    if (this._callStatus !== status) {
      this._callStatus = status;
    }
  };
  isEstablished = (): boolean => {
    return (
      this._callStatus === CALL_STATUS_ACTIVE ||
      this._callStatus === CALL_STATUS_CONNECTING
    );
  };
  isActive = (): boolean => {
    if (
      this._callStatus === CALL_STATUS_CONNECTING ||
      this._callStatus === CALL_STATUS_ACTIVE
    ) {
      return true;
    }
    return false;
  };
  isMediaActive = (): boolean => {
    if (
      this._callStatus === CALL_STATUS_ACTIVE &&
      this._mediaSessionStatus === MEDIA_SESSION_STATUS_ACTIVE
    ) {
      return true;
    }
    return false;
  };
  hasLocalVideo = (): boolean => {
    if (this._inputMediaStream) {
      return this._inputMediaStream.getVideoTracks().length > 0;
    }
    return false;
  };
  hasRemoteVideo = (): boolean => {
    if (this._outputMediaStream) {
      return this._outputMediaStream.getVideoTracks().length > 0;
    }
    return false;
  };
  getMediaSessionStatus = (): MediaSessionStatus => {
    return this._mediaSessionStatus;
  };
  setMediaSessionStatus = (status: MediaSessionStatus): void => {
    this._mediaSessionStatus = status;
  };
  getDtmfOptions = (): DtmfOptions => {
    return this._dtmfOptions;
  };
  getRTCConfig = (): RTCConfiguration => {
    return this._rtcConfig;
  };
  getRTCOfferConstraints = (): RTCOfferOptions => {
    return {
      iceRestart: false,
    };
  };
  getInputMediaStream = (): MediaStream | null => {
    return this._inputMediaStream;
  };
  getOutputMediaStream = (): MediaStream | null => {
    return this._outputMediaStream;
  };
  onNewRTCSession = (rtcSession: RTCSession, request): void => {
    // tslint:disable-next-line:no-console
    console.log("ON NEW RTC Session");
    if (!rtcSession) {
      throw Error(`New Session is not active`);
    }
    this.remoteName = rtcSession.remote_identity.display_name;
    if (this.remoteName === null || this.remoteName === "") {
      this.remoteName = rtcSession.remote_identity?.uri?.user;
    }
    this.remoteUser = rtcSession.remote_identity?.uri?.user;
    this.remoteUri = rtcSession.remote_identity?.uri?.toAor();
    this.setRTCSession(rtcSession);
    this._initSessionEventHandler();
    this._eventEmitter.emit("call.update", { call: this });
  };
  setPeerConnection = (conn: RTCPeerConnection | null): void => {
    this._peerConnection = conn;
  };
  isDialing = (): boolean => {
    if (
      this._callStatus === CALL_STATUS_DIALING ||
      this._callStatus === CALL_STATUS_PROGRESS
    ) {
      return true;
    }
    return false;
  };
  isRinging = (): boolean => {
    return this._callStatus === CALL_STATUS_RINGING;
  };
  // whether call is in establishing state
  isEstablishing = (): boolean => {
    if (
      this._callStatus === CALL_STATUS_DIALING ||
      this._callStatus === CALL_STATUS_RINGING ||
      this._callStatus === CALL_STATUS_PROGRESS
    ) {
      return true;
    }
    return false;
  };
  errorReason = (): string => {
    return this._errorCause;
  };
  isFailed = (): boolean => {
    return this._endType === "failure";
  };
  getDisposition = (): string => {
    let disp = "Idle";
    switch (this._callStatus) {
      case CALL_STATUS_DIALING:
        disp = "Dialing";
        break;
      case CALL_STATUS_RINGING:
        disp = "Ringing";
        break;
      case CALL_STATUS_PROGRESS:
        disp = "Progress";
        break;
      case CALL_STATUS_CONNECTING:
      case CALL_STATUS_ACTIVE:
        disp = "Active";
        if (
          this._mediaSessionStatus === MEDIA_SESSION_STATUS_SENDONLY ||
          this._mediaSessionStatus === MEDIA_SESSION_STATUS_INACTIVE
        ) {
          disp = "Hold";
        }
        break;
    }
    return disp;
  };
  changeOutputVolume = (vol: number): void => {
    this._mediaEngine.changeOutStreamVolume(this.getId(), vol);
  };
  getOutputVolume = (): number => {
    return this._mediaEngine.getOutStreamVolume(this.getId());
  };
  _setInputMediaStream = (stream: MediaStream | null): void => {
    this._inputMediaStream = stream;
  };
  _setOutputMediaStream = (stream: MediaStream | null): void => {
    this._outputMediaStream = stream;
  };
  _configureDebug = (): void => {
    if (this._debug) {
      JsSIP.debug.enable(this._debugNamespaces || 'JsSIP:*');
      this._logger = console;
    } else {
      JsSIP.debug.disable();
      this._logger = dummyLogger;
    }
  };
  _uuid = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      // tslint:disable-next-line:no-bitwise
      const r = (Math.random() * 16) | 0;
      // tslint:disable-next-line:no-bitwise
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
  // Dial a new call
  dial = (
    ua: JsSIP.UA, // SIP UA instance
    target: string, // target uri
    hasAudio: boolean, // has audio
    hasVideo: boolean,
    appEventHandler: AppCallEventHandler
  ): void => {
    let media = "audio";
    if (hasVideo) {
      media = "video";
      this._hasLocalVideo = true;
    }
    this._appEventHandler = appEventHandler;
    console.log("Inside SIP Call dial");
    this._mediaEngine
      .openStreams(this.getId(), hasAudio, hasVideo)
      .then((stream) => {
        if (!stream) {
          throw Error("Failed to open the input streams");
        }
        console.log("Opened media stream");
        const opts = {
          mediaConstraints: {
            audio: hasAudio,
            video: hasVideo,
          },
          mediaStream: stream,
          rtcOfferConstraints: {
            iceRestart: false,
          },
          pcConfig: this.getRTCConfig(),
          extraHeaders: this.getExtraHeaders().invite,
          sessionTimersExpires: this.getSessionTimerExpires(),
        };
        this.remoteUri = target;
        this.setCallStatus(CALL_STATUS_DIALING);
        // set the input stream
        this._setInputMediaStream(stream);
        this._hasLocalVideo = hasVideo;
        this._eventEmitter.emit("call.update", { call: this });
        ua.call(target, opts);
      });
  };
  // ACCEPT incoming call
  accept = (
    hasAudio: boolean = true,
    hasVideo: boolean = false,
    appParams: object,
    appEventHandler: AppCallEventHandler
  ): void => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }
    if (this.getCallStatus() !== CALL_STATUS_RINGING) {
      this._logger.error(
        `Calling answer() is not allowed when call status is ${this.getCallStatus()}`
      );
      return;
    }
    if (hasVideo) {
      this._hasLocalVideo = true;
    }
    const mediaType = hasVideo ? "video" : "audio";
    this._appParams = { ...this._appParams, ...appParams };
    this._appEventHandler = appEventHandler;
    // stop the ringtone and start a session
    this._mediaEngine.stopRingTone();
    this._mediaEngine.startSession(mediaType);

    this._mediaEngine
      .openStreams(this.getId(), hasAudio, hasVideo)
      .then((inputStream) => {
        // attach input stream to HTML media elements
        const options = {
          // if extra headers are required for a provider then enable it using config
          extraHeaders: this.getExtraHeaders().resp2xx,
          mediaConstraints: {
            audio: true,
            video: hasVideo,
          },
          pcConfig: this.getRTCConfig(),
          mediaStream: inputStream,
          sessionTimerExpires: this.getSessionTimerExpires(),
        };
        // JsSIP answer
        this.getRTCSession()!.answer(options);
        this.setCallStatus(CALL_STATUS_CONNECTING);
        this._setInputMediaStream(inputStream);
        this._startDurTimer();
        this._hasAnswered = true;
        // update the call state in the app
        this._eventEmitter.emit("call.update", { call: this });
        if (this._appEventHandler) {
          this._appEventHandler("call.answered", {});
        }
        return;
      })
      .catch((err) => {
        console.log(err);
        return;
      })
  };
  // REJECT incoming call
  reject = (appParams: object, code: number = 486, reason: string = "Busy Here"): void => {
    if (!this.isSessionActive()) {
      this._logger.error("RtcSession is not active");
      return;
    }
    if (this.getCallStatus() !== CALL_STATUS_RINGING) {
      this._logger.error(
        `Calling reject() is not allowed when call status is ${this.getCallStatus()}`
      );
      return;
    }
    this._appParams = { ...this._appParams, ...appParams };
    this.setCallStatus(CALL_STATUS_TERMINATING);
    this._mediaEngine.stopRingTone();
    // Terminate options
    const options = {
      extraHeaders: this.getExtraHeaders().resp4xx,
      status_code: code,
      reason_phrase: reason,
    };
    this.getRTCSession()!.terminate(options);
    this._eventEmitter.emit("call.update", { call: this });
  };

  // HANGUP
  hangup = (): void => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }

    if (
      this.getCallStatus() !== CALL_STATUS_DIALING &&
      this.getCallStatus() !== CALL_STATUS_PROGRESS &&
      this.getCallStatus() !== CALL_STATUS_CONNECTING &&
      this.getCallStatus() !== CALL_STATUS_ACTIVE
    ) {
      this._logger.error(
        `Calling hangup() is not allowed when call status is ${this.getCallStatus()}`
      );
      return;
    }
    this.setCallStatus(CALL_STATUS_TERMINATING);
    const options = {
      extraHeaders: this.getExtraHeaders().nonInvite,
    };

    this.getRTCSession()!.terminate(options);
    // close the input stream
    this._mediaEngine.closeStream(this.getId());
    this._setInputMediaStream(null);
    this._mediaEngine.stopSession();
    this._eventEmitter.emit("call.update", { call: this });
  };
  // send DTMF
  sendDTMF = (tones: string): void => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      throw new Error(
        `Calling sendDTMF() is not allowed when call status is ${this.getCallStatus()}`
      );
    }
    // DTMF should not be send while on hold
    // Allow for local hold (SEND ONLY) ??
    if (
      this._mediaSessionStatus === MEDIA_SESSION_STATUS_SENDONLY ||
      this._mediaSessionStatus === MEDIA_SESSION_STATUS_RECVONLY ||
      this._mediaSessionStatus === MEDIA_SESSION_STATUS_INACTIVE
    ) {
      this._logger.error("DTMF is not allowed while call is on hold");
      return;
    }
    const options = {
      duration: this.getDtmfOptions().duration,
      interToneGap: this.getDtmfOptions().interToneGap,
      transportType: this.getDtmfOptions().channelType,
    };
    this.getRTCSession()!.sendDTMF(tones, options);
  };
  // Send INFO
  sendInfo = (contentType: string, body?: string): void => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }
    // currently INFO is supported only on active call
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      throw new Error(
        `Calling sendInfo() is not allowed when call status is ${this.getCallStatus()}`
      );
    }
    const options = {
      extraHeaders: this.getExtraHeaders().info,
    };
    this.getRTCSession()!.sendInfo(contentType, body, options);
  };
  hold = (): void => {
    if (!this.isSessionActive()) {
      this._logger.error("RTCSession is not active");
      return;
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      this._logger.error(
        `Calling hold() is not allowed when call status is ${this.getCallStatus()}`
      );
      return;
    }
    if (
      this.getMediaSessionStatus() === MEDIA_SESSION_STATUS_SENDONLY ||
      this.getMediaSessionStatus() === MEDIA_SESSION_STATUS_INACTIVE
    ) {
      this._logger.error(
        `Calling hold() is not allowed when call is already on local hold`
      );
      return;
    }
    const options = {
      useUpdate: false, // UPDATE based hold is not supported by most vendors
      extraHeaders: this.getExtraHeaders().invite,
    };
    this.getRTCSession()!.hold(options);
  };
  unhold = (): void => {
    if (!this.isSessionActive()) {
      this._logger.error("RTC Session is not valid");
      return;
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      this._logger.error(
        `Calling unhold() is not allowed when call status is ${this.getCallStatus()}`
      );
      return;
    }
    if (
      this.getMediaSessionStatus() !== MEDIA_SESSION_STATUS_SENDONLY &&
      this.getMediaSessionStatus() !== MEDIA_SESSION_STATUS_INACTIVE
    ) {
      this._logger.error(
        `Calling unhold() is not allowed when call is not on hold`
      );
      return;
    }
    const options = {
      useUpdate: false, // UPDATE based hold is not supported by most vendors
      extraHeaders: this.getExtraHeaders().invite,
    };
    this.getRTCSession()!.unhold(options);
  };
  // toggle between hold
  toggleHold = (): void => {
    if (this.isOnLocalHold()) {
      this.unhold();
    } else {
      this.hold();
    }
  };
  isOnLocalHold = (): boolean => {
    if (!this.isSessionActive()) {
      return false;
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      return false;
    }
    const holdStatus = this.getRTCSession()!.isOnHold();
    if (holdStatus) {
      return holdStatus.local;
    }
    return false;
  };
  isOnRemoteHold = (): boolean => {
    if (!this.isSessionActive()) {
      return false;
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      return false;
    }
    const holdStatus = this.getRTCSession()!.isOnHold();
    if (holdStatus) {
      return holdStatus.remote;
    }
    return false;
  };

  offerVideo = (): void => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      throw new Error(
        `Calling offerVideo() is not allowed when call status is ${this.getCallStatus()}`
      );
    }
    if (this._hasLocalVideo) {
      this._logger.warn("OfferVideo is not allowed if Video is already present");
      return;
    }
    // fetch the modified stream
    this._mediaEngine.updateStream(this.getId(), true, true)
      .then((stream) => {
        if (!stream) {
          throw Error("OfferVideo: Failed to fetch input stream");
        }
        // update the streams
        const inStream = this.getInputMediaStream();
        // update the stream in RTCPeerConnection
        this._peerConnection.removeStream(inStream);
        this._peerConnection.addStream(stream);
        const options = {
          useUpdate: false,
          rtcOfferConstraints: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            iceRestart: false,
          },
        };
        // re-negotiate the new stream
        this._rtcSession?.renegotiate(options,
          () => {
            this._setInputMediaStream(stream);
            this._hasLocalVideo = true;
            this._eventEmitter.emit("call.update", {call: this});
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };
  changeInputVolume = (vol: number): void => {
    this._mediaEngine.changeInStreamVolume(this.getId(), vol);
  };
  getInputVolume = (): number => {
    return this._mediaEngine.getInStreamVolume(this.getId());
  };
  renegotiate = (): boolean => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      throw new Error(
        `Calling renegotiate() is not allowed when call status is ${this.getCallStatus()}`
      );
    }
    const options = {
      useUpdate: false,
      extraHeaders: this.getExtraHeaders().invite,
    };
    return this.getRTCSession()!.renegotiate(options);
  };
  amplifySpeakerOn = (multiplier: number) => {
    this._mediaEngine.amplifyAudioOn(this.getId(), multiplier);
  };
  amplifySpeakerOff = () => {
    this._mediaEngine.amplifyAudioOff(this.getId());
  };
  _mute = (isAudio: boolean = true): void => {
    if (!this.isSessionActive()) {
      this._logger.error("RTCSession is not active");
      return;
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      this._logger.error(
        `Calling mute is not allowed when call status is ${this._callStatus}`
      );
      return;
    }
    if (isAudio && this._mediaDeviceStatus.audio === MEDIA_DEVICE_STATUS_MUTE) {
      this._logger.warn("Audio device is already in mute state");
      return;
    }
    if (
      !isAudio &&
      this._mediaDeviceStatus.video === MEDIA_DEVICE_STATUS_MUTE
    ) {
      this._logger.warn("Video device is already in mute state");
      return;
    }
    const options = {
      audio: isAudio,
      video: !isAudio,
    };
    this.getRTCSession()!.mute(options);
  };
  _unmute = (isAudio: boolean = true): void => {
    if (!this.getRTCSession()) {
      this._logger.error("RTCSession is not active");
      return;
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      this._logger.error(
        `Calling mute is not allowed when call status is ${this._callStatus}`
      );
      return;
    }
    if (isAudio && this._mediaDeviceStatus.audio !== MEDIA_DEVICE_STATUS_MUTE) {
      this._logger.warn("Audio device not in mute state");
      return;
    }
    if (
      !isAudio &&
      this._mediaDeviceStatus.video !== MEDIA_DEVICE_STATUS_MUTE
    ) {
      this._logger.warn("Video device not in mute state");
      return;
    }
    const options = {
      audio: isAudio,
      video: !isAudio,
    };
    this.getRTCSession()!.unmute(options);
  };
  muteAudio = (): void => {
    this._mute(true);
  };
  muteVideo = (): void => {
    this._mute(false);
  };
  unMuteAudio = (): void => {
    this._unmute(true);
  };
  unMuteVideo = (): void => {
    this._unmute(false);
  };
  toggleAudioMute = (): void => {
    if (this._mediaDeviceStatus.audio === MEDIA_DEVICE_STATUS_ACTIVE) {
      this.muteAudio();
    } else {
      this.unMuteAudio();
    }
  };
  toggleVideoMute = (): void => {
    if (this._mediaDeviceStatus.video === MEDIA_DEVICE_STATUS_ACTIVE) {
      this.muteVideo();
    } else {
      this.unMuteVideo();
    }
  };
  isAudioOnMute = (): boolean => {
    return this._mediaDeviceStatus.audio === MEDIA_DEVICE_STATUS_MUTE;
  };
  isVideoOnMute = (): boolean => {
    return this._mediaDeviceStatus.video === MEDIA_DEVICE_STATUS_MUTE;
  };
  startScreenShare = (): boolean => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      throw new Error(
        `Start Screenshare is not allowed when call status is ${this.getCallStatus()}`
      );
    }
    // not implemented
    return false;
  };
  stopScreenShare = (): boolean => {
    if (!this.isSessionActive()) {
      throw new Error("RtcSession is not active");
    }
    if (this.getCallStatus() !== CALL_STATUS_ACTIVE) {
      throw new Error(
        `Stop Screenshare is not allowed when call status is ${this.getCallStatus()}`
      );
    }
    if (!this._shareScreen) {
      throw new Error("Screen share session is not active");
    }
    // not implemented
    return false;
  };
  toggleScreenShare = () => {
    if (this._shareScreen) {
      this.stopScreenShare();
    } else {
      this.startScreenShare();
    }
  };
  isScreenShareOn = () => {
    return this._shareScreen;
  };
  /*
   * Blind transfer
   * Transferor sends target uri to transferee using REFER
   */
  blindTransfer = (target: string): void => {
    if (!this.getRTCSession()) {
      throw new Error("RtcSession is not active");
    }
    // TODO implement transfer logic
    const transferOptions = {
      eventHandlers: {
        requestSucceeded: this._onReferSuccess,
        requestFailed: this._onReferfailed,
        accepted: this._onTransferAcceptNotify,
        failed: this._onTransferFailureNotify,
      },
    };
    this.getRTCSession()!.refer(target, transferOptions);
    this._transferStatus = TRANSFER_STATUS_INITIATED;
  };
  /*
   * Attended Transfer (Transfer with Consultation hold)
   * RFC 5589
   * Dialog 1: Transferor and Transferee (hold)
   * Dialog 2: Transferor and Target
   * Transfer logic:
   * Hold Dialog 2
   * Send Refer with Dialog 1 session in replaces.
   */
  attendedTransfer = (replaceCall: SipCall): void => {
    if (!this.getRTCSession()) {
      throw new Error("RtcSession is not active");
    }
    // allow only if replace call is on hold
    if (!replaceCall.isOnLocalHold()) {
      this._logger.error(
        "Attended transfer is allowed only if call is on hold"
      );
      return;
    }
    const replaceSession = replaceCall.getRTCSession();
    if (!replaceSession) {
      this._logger.error("Replace session is not valid");
      return;
    }
    const transferOptions = {
      replaces: replaceSession,
      eventHandlers: {
        requestSucceeded: this._onReferSuccess,
        requestFailed: this._onReferfailed,
        accepted: this._onTransferAcceptNotify,
        failed: this._onTransferFailureNotify,
      },
    };
    // hold the current call
    if (!this.isOnLocalHold()) {
      this.hold();
    }
    this.getRTCSession()?.refer(this.remoteUri, transferOptions);
    this._transferStatus = TRANSFER_STATUS_INITIATED;
  };
  /*
   * Park call - based on basic blind transfer
   * 'dest' should contain the 'feature prefix' + 'slot no'
   */
  parkCall = (dest: string): void => {
    if (!this.getRTCSession()) {
      this._logger.error("Session is not active, invalid API call");
      return;
    }
    // park event handlers
    const options = {
      eventHandlers: {
        requestSucceeded: () => {
          // tslint:disable-next-line:no-console
          console.log("ON Park refer success");
        },
        requestFailed: () => {
          // tslint:disable-next-line:no-console
          console.log("ON Park refer failed");
        },
        accepted: () => {
          // tslint:disable-next-line:no-console
          console.log("ON Park accept notification");
        },
        failed: () => {
          // tslint:disable-next-line:no-console
          console.log("ON Park failure notification");
        },
      },
    };
    this.getRTCSession()!.refer(dest, options);
  };
  _onReferSuccess = (data): void => {
    // tslint:disable-next-line:no-console
    console.log("ON Transfer refer success");
    this._transferStatus = TRANSFER_STATUS_REFER_SUCCESS;
  };
  _onReferfailed = (data): void => {
    // tslint:disable-next-line:no-console
    console.log("ON Transfer refer failed");
    this._transferStatus = TRANSFER_STATUS_FAILED;
  };
  _onTransferAcceptNotify = (data): void => {
    // tslint:disable-next-line:no-console
    console.log("ON Transfer accept notification");
    this._transferStatus = TRANSFER_STATUS_COMPLETE;
  };
  _onTransferFailureNotify = (data): void => {
    // tslint:disable-next-line:no-console
    console.log("ON Transfer failure notification");
    this._transferStatus = TRANSFER_STATUS_FAILED;
  };
  _handleRemoteTrack = (track: MediaStreamTrack): void => {
    this._mediaEngine.startOrUpdateOutStreams(
      this.getId(),
      this._outputMediaStream,
      track
    );
  };
  _handleLocalSdp = (sdp: string): string => {
    const sdpObj = sdpTransform.parse(sdp);
    // const oldMedia = this._localMedia;
    this._localMedia = [];
    sdpObj.media.forEach((media) => {
      let mode = "sendrecv";
      const type = media.type;
      if (media.direction !== undefined) {
        mode = media.direction;
      }
      if (type === "video" && media.port !== 0) {
        // tslint:disable-next-line:no-console
        // console.log('Local Video present');
      }
      this._localMedia.push({ mode, type, payloads: media.rtp });

      if (this._modifySdp) {
        if (type === "video") {
          // tslint:disable-next-line:no-console
          console.log("Media:", media);
          const purgePts: number[] = [];
          const supportedCodecs = this._videoCodecs;
          media.rtp.forEach((item) => {
            if (!supportedCodecs.includes(item.codec)) {
              purgePts.push(item.payload);
            }
            /*
            // if control over dynamic payload types
            // remove dynamic payloads
            else if (item.payload !== 125) {
              purgePts.push(item.payload);
            }
             */
          });
          const pts = media.payloads.toString().split(" ");
          const filteredPts = pts.filter(
            (item) => !purgePts.includes(parseInt(item, 10))
          );
          const fmtp = media.fmtp.filter(
            (item) => !purgePts.includes(item.payload)
          );
          const rtcpFb = media.rtcpFb.filter(
            (item) => !purgePts.includes(item.payload)
          );
          const rtp = media.rtp.filter(
            (item) => !purgePts.includes(item.payload)
          );
          media.payloads = filteredPts.join(" ");
          media.fmtp = fmtp;
          media.rtcpFb = rtcpFb;
          media.rtp = rtp;
        }
      }
    });
    // tslint:disable-next-line:no-console
    // console.log(this._localMedia);
    const sdpStr = sdpTransform.write(sdpObj);
    // tslint:disable-next-line:no-console
    // console.log(sdpStr);
    return sdpStr;
  };
  _handleRemoteOffer = (sdp: string): void => {
    const sdpObj = sdpTransform.parse(sdp);
    // RFC 3264
    // if offer received with zero media streams
    if (sdpObj.media === undefined || sdpObj.media.length === 0) {
      this._logger.debug("SDP Offer received with zero media streams");
      return;
    }
    const sdpAudio = sdpObj.media.find((mline) => mline.type === "audio");
    const sdpVideo = sdpObj.media.find((mline) => mline.type === "video");
    if (sdpAudio !== undefined) {
      // currently assuming audio stream always present
      // todo: set audio present flag, if needed
    }
    if (sdpVideo !== undefined && sdpVideo.port !== 0) {
      // tslint:disable-next-line:no-console
      // console.log('Incoming video call');
      this._hasRemoteVideo = true;
    }
    // fetch the media line
    // const oldMedia = this._remoteMedia;
    this._remoteMedia = [];
    sdpObj.media.forEach((media) => {
      let mode = "sendrecv";
      if (media.direction !== undefined) {
        mode = media.direction;
      }
      this._remoteMedia.push({ mode, type: media.type, payloads: media.rtp });
    });
    this._sdpStatus = SDP_OFFER_RECEIVED;
    // tslint:disable-next-line:no-console
    // console.log(this._remoteMedia);
  };
  _handleRemoteAnswer = (sdp: string): void => {
    const sdpObj = sdpTransform.parse(sdp);
    // RFC 3264
    // if offer received with zero media streams
    if (sdpObj.media === undefined || sdpObj.media.length === 0) {
      // ERROR - Disconnect the call
      this._logger.error("SDP Answer received with zero media streams");
      return;
    }
    const sdpVideo = sdpObj.media.find((mline) => mline.type === "video");
    if (sdpVideo !== undefined && sdpVideo.port !== 0) {
      this._hasRemoteVideo = true;
    }
    // fetch the media line
    // const oldMedia = this._remoteMedia;
    this._remoteMedia = [];
    sdpObj.media.forEach((media) => {
      let mode = "sendrecv";
      if (media.direction !== undefined) {
        mode = media.direction;
      }
      // if answer receives with port zero, means
      // remote rejected the offered media stream
      if (media.port !== 0) {
        this._remoteMedia.push({ mode, type: media.type, payloads: media.rtp });
      }
    });
    this._sdpStatus = SDP_OFFER_ANSWER_COMPLETE;
  };
  registerDurationListener = (module: string, listener: AppCallEventHandler) => {
    this._durListeners[module] = listener;
  };
  _startDurTimer = () => {
    if(this._durTimerId !== 0) {
      // TODO restart
      return;
    }
    this._durTimerId = setInterval(() => {
      if (this._durSec >= 59) {
        this._durMin += 1;
        this._durSec = 0;
      } else {
        this._durSec += 1;
      }
      for (const key of Object.keys(this._durListeners)) {
        this._durListeners[key](this._id, this._durMin, this._durSec);
      }
    }, 1000);
  };
  _stopDurTimer = () => {
    if (this._durTimerId !== 0) {
      clearInterval(this._durTimerId);
      this._durTimerId = 0;
    }
  };
  _initSessionEventHandler = (): void => {
    const rtcSession = this.getRTCSession();
    if (!this.isSessionActive()) {
      throw Error(`SM Init failed - Session is not ACTIVE`);
    }

    if (rtcSession?.connection) {
      const peerConnection = rtcSession.connection;
      this.setPeerConnection(peerConnection);

      /*
       "track" event is not triggered.
       In the current react native webrtc version , track events are not supported
       */
      peerConnection.addEventListener("track", (event: RTCTrackEvent) => {
        // tslint:disable-next-line:no-console
        console.log("ON track event");
        this._logger.debug('PeerConnection "ontrack" event received');
        this._handleRemoteTrack(event.track);
        this._eventEmitter.emit("call.update", { call: this });

        event.track.addEventListener("unmute", (ev) => {
          // const activeTrack = ev.target as MediaStreamTrack;
        });
        event.track.addEventListener("mute", (ev) => {
          // const mutedTrack = ev.target as MediaStreamTrack;
          // tslint:disable-next-line:no-console
          // console.log('Received track mute event');
        });
        event.track.addEventListener("ended", (ev) => {
          // tslint:disable-next-line:no-console
          // console.log('Received track ended event');
        });
      });
      peerConnection.addEventListener("addstream", (event) => {
        // tslint:disable-next-line:no-console
        console.log("Received ADD Stream event");
        if (event?.target?._remoteStreams.length > 0) {
          const stream = event?.target?._remoteStreams[0];
          this._setOutputMediaStream(stream);
        }
        this._eventEmitter.emit("call.update", { call: this });
      });
      peerConnection.addEventListener("removestream", (event) => {
        // tslint:disable-next-line:no-console
        console.log("Received REMOVE Stream event");
        // if remote stream is closed
        //if (event?.target?._remoteStreams.length === 0) {
        //  this._setOutputMediaStream(null);
        //}
        this._eventEmitter.emit("call.update", { call: this });
      });
    }

    rtcSession!.on("peerconnection", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON peerconnection event");
      // handle peer connection events
      this._logger.debug('RTCSession "peerconnection" event received', data);
      // pass the event to the provider
      this.setPeerConnection(data.peerconnection);
      /*
       Following "track" event is not triggered.
       In the current react native webrtc version , track events are not supported
       */
      data.peerconnection.addEventListener("track", (event: RTCTrackEvent) => {
        // tslint:disable-next-line:no-console
        console.log("ON track event received");
        this._logger.debug('PeerConnection "ontrack" event received');
        this._handleRemoteTrack(event.track);
        this._eventEmitter.emit("call.update", { call: this });
      });
      data.peerconnection.addEventListener("addstream", (event) => {
        // tslint:disable-next-line:no-console
        console.log("On add stream event recieved");
        this._logger.debug('PeerConnection "addstream" event received');
        if (event?.target?._remoteStreams.length > 0) {
          const stream = event?.target?._remoteStreams[0];
          this._setOutputMediaStream(stream);
        }
        this._eventEmitter.emit("call.update", { call: this });
      });
      data.peerconnection.addEventListener("removestream", (event) => {
        // tslint:disable-next-line:no-console
        console.log("On Remove stream event recieved");
        this._logger.debug('PeerConnection "addstream" event received');
        // TODO: Update the stream and show masked background in UI
        //if (event?.target?._remoteStreams.length === 0) {
        //  this._setOutputMediaStream(null);
        //}
        this._eventEmitter.emit("call.update", { call: this });
      });
    });
    rtcSession!.on("peerconnection:setremotedescriptionfailed", (data) => {
      this._logger.debug("Peerconnection set remote description failed ", data);
    });
    rtcSession!.on("peerconnection:setlocaldescriptionfailed", (data) => {
      this._logger.debug("Peerconnection set local description failed ", data);
    });
    // CONNECTING EVENT
    rtcSession!.on("connecting", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON connecting event");
      // log it
      this._logger.debug('RTCSession "connecting" event received', data);
    });
    // SENDING
    rtcSession!.on("sending", (data) => {
      // log it
      this._logger.debug('RTCSession "sending" event received', data);
    });
    rtcSession!.on("progress", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session Progress event");
      this._logger.debug('RTCSession "progress" event received', data);
      if (this.getCallStatus() === CALL_STATUS_DIALING) {
        this.setCallStatus(CALL_STATUS_PROGRESS);
        const mediaType = this._hasLocalVideo ? 'video' : 'audio';
        // No ringback tone
        this._mediaEngine.startSession(mediaType);
        this._eventEmitter.emit("call.update", { call: this });
      }
    });
    // 200 OK received/send
    rtcSession!.on("accepted", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session accepted event");
      this._startDurTimer();
      const mediaType = this._hasLocalVideo ? 'video' : 'audio';
      this._logger.debug('RTCSession "accepted" event received', data);
      if (rtcSession?.start_time && rtcSession.start_time !== undefined) {
        this.startTime = rtcSession?.start_time.toString();
      }
      this.setCallStatus(CALL_STATUS_CONNECTING);
      this._mediaEngine.stopRingbackTone();
      // Accepted received before Progress state
      this._mediaEngine.startSession(mediaType);
      this._eventEmitter.emit("call.update", { call: this });
    });
    rtcSession!.on("confirmed", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session confirmed event");
      this._logger.debug('RTCSession "confirmed" event received', data);
      this.setCallStatus(CALL_STATUS_ACTIVE);
      this.setMediaSessionStatus(MEDIA_SESSION_STATUS_ACTIVE);
      this._eventEmitter.emit("call.confirmed", { call: this });
    });
    rtcSession!.on("ended", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session ended event");
      this._logger.debug('RTCSession "ended" event received', data);
      const { originator, cause } = data;
      let reason = "Failed";
      switch (cause) {
        case JsSIP.C.causes.BUSY:
          reason = "Busy";
          break;
        case JsSIP.C.causes.CANCELED:
        case JsSIP.C.causes.BYE:
          reason = "Hangup";
          break;
        case JsSIP.C.causes.NO_ANSWER:
          reason = "No Answer";
          break;
        case JsSIP.C.causes.REJECTED:
          reason = "Declined";
          break;
        case JsSIP.C.causes.CANCELED:
          reason = 'Canceled';
      }
      this._mediaEngine.closeStream(this.getId());
      this._setInputMediaStream(null);
      this._outputMediaStream = null;

      if (rtcSession?.end_time && rtcSession.end_time !== undefined) {
        this.endTime = rtcSession?.end_time.toString();
      }
      this._endType = "hangup";
      if (this.getCallStatus() === CALL_STATUS_RINGING) {
        this._mediaEngine.stopRingTone();
      } else if (this.getCallStatus() === CALL_STATUS_PROGRESS) {
        this._mediaEngine.stopSession(true);
      } else {
        this._mediaEngine.stopSession();
      }
      this.setCallStatus(CALL_STATUS_IDLE);
      this.setMediaSessionStatus(MEDIA_SESSION_STATUS_IDLE);
      this._stopDurTimer();
      // send originator, reason
      this._eventEmitter.emit("call.ended", { call: this, originator, reason });
      // remove media event listeners
      this._removeMediaEventListeners();
    });
    rtcSession!.on("failed", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session failed event", data.originator, data.cause);
      this._logger.debug('RTCSession "failed" event received', data);
      const { originator, cause } = data;
      this._mediaEngine.closeStream(this.getId());
      this._setInputMediaStream(null);
      this._outputMediaStream = null;
      if (this.getCallStatus() === CALL_STATUS_RINGING) {
        this._mediaEngine.stopRingTone();
      } else if (this.getCallStatus() === CALL_STATUS_PROGRESS) {
        this._mediaEngine.stopSession(true);
      } else {
        this._mediaEngine.stopSession();
      }
      this._endType = "failure";
      this._errorCause = `${originator}: ${cause}`;
      this.setCallStatus(CALL_STATUS_IDLE);
      this.setMediaSessionStatus(MEDIA_SESSION_STATUS_IDLE);
      this._stopDurTimer();
      this._eventEmitter.emit("call.ended", {
        call: this,
        originator,
        reason: "Failed",
      });
    });
    rtcSession!.on("newDTMF", (data) => {
      this._logger.debug('RTCSession "newDtmf" event received', data);
    });
    rtcSession!.on("newInfo", (data) => {
      this._logger.debug('RTCSession "newInfo" event received', data);
    });
    rtcSession!.on("hold", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session hold event");
      const originator = data.originator;
      const mediaSessionStatus = this.getMediaSessionStatus();
      this._logger.debug('RTCSession "hold" event received', data);
      if (originator === "remote") {
        if (mediaSessionStatus === MEDIA_SESSION_STATUS_ACTIVE) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_RECVONLY);
        } else if (mediaSessionStatus === MEDIA_SESSION_STATUS_SENDONLY) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_INACTIVE);
        }
      } else {
        if (mediaSessionStatus === MEDIA_SESSION_STATUS_ACTIVE) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_SENDONLY);
        } else if (mediaSessionStatus === MEDIA_SESSION_STATUS_RECVONLY) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_INACTIVE);
        }
      }
      // Notify app - so app can play tones if required
      this._eventEmitter.emit("call.update", { call: this });
    });
    rtcSession!.on("unhold", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session unhold event");
      const originator = data.originator;
      const mediaSessionStatus = this.getMediaSessionStatus();

      this._logger.debug('RTCSession "unhold" event received', data);
      if (originator === "remote") {
        if (mediaSessionStatus === MEDIA_SESSION_STATUS_RECVONLY) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_ACTIVE);
        } else if (mediaSessionStatus === MEDIA_SESSION_STATUS_INACTIVE) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_SENDONLY);
        }
      } else {
        if (mediaSessionStatus === MEDIA_SESSION_STATUS_SENDONLY) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_ACTIVE);
        } else if (mediaSessionStatus === MEDIA_SESSION_STATUS_INACTIVE) {
          this.setMediaSessionStatus(MEDIA_SESSION_STATUS_RECVONLY);
        }
      }
      this._eventEmitter.emit("call.update", { call: this });
    });
    rtcSession!.on("muted", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session muted event");
      const { audio, video } = data;
      this._logger.debug('RTCSession "muted" event received', data);
      if (audio) {
        this._mediaDeviceStatus.audio = MEDIA_DEVICE_STATUS_MUTE;
      }
      if (video) {
        this._mediaDeviceStatus.video = MEDIA_DEVICE_STATUS_MUTE;
      }
      this._eventEmitter.emit("call.update", { call: this });
    });
    rtcSession!.on("unmuted", (data) => {
      // tslint:disable-next-line:no-console
      console.log("ON session unmuted event");
      const { audio, video } = data;
      this._logger.debug('RTCSession "unmuted" event received', data);
      if (audio) {
        this._mediaDeviceStatus.audio = MEDIA_DEVICE_STATUS_ACTIVE;
      }
      if (video) {
        this._mediaDeviceStatus.video = MEDIA_DEVICE_STATUS_ACTIVE;
      }
      this._eventEmitter.emit("call.update", { call: this });
    });
    rtcSession!.on("reinvite", (data) => {
      this._logger.debug('RTCSession "re-invite" event received', data);
      // tslint:disable-next-line:no-console
      console.log("ON session re-invite event");
    });
    rtcSession!.on("update", (data) => {
      this._logger.debug('RTCSession "update" event received', data);
    });
    rtcSession!.on("refer", (data) => {
      this._logger.debug('RTCSession "refer" event received', data);
      // TODO Handle Refer for Transfer
    });
    rtcSession!.on("replaces", (data) => {
      this._logger.debug('RTCSession "replaces" event received', data);
      // TODO Handle Replaces for Transfer
    });
    rtcSession!.on("sdp", (data) => {
      this._logger.debug("RTCSession SDP event received");
      /*
      const { originator, type, sdp } = data;
      if (originator === 'remote') {
        if (type === 'answer') {
          this._handleRemoteAnswer(sdp);
        } else if (type === 'offer') {
          this._handleRemoteOffer(sdp);
        }
      } else {
        const modified = this._handleLocalSdp(sdp);
        if (this._modifySdp) {
          data.sdp = modified;
        }
      }
       */
    });
    rtcSession!.on("icecandidate", (data) => {
      this._logger.debug('RTCSession "icecandidate" event received', data);
    });
  };

  _videoInputUpdateListener = (event:object): void => {
    /*
     * Handles video front/environment camera toggle.
     * - Update the stream in RTCPeerConnection.
     * - Re-negotiate the stream
     * - Updates locally
     *
     * TODO: re-negotiation failures
     */
    if (event.reqId === this.getId()) {
      // update the streams
      const inStream:MediaStream = this.getInputMediaStream();
      const mediaStream = event.stream;
      // remove the existing video tracks
      inStream?.getVideoTracks().forEach((track) => {
        track.enabled = false;
        track.stop();
        inStream.removeTrack(track);
      });
      // update the stream in RTCPeerConnection
      this._peerConnection.removeStream(inStream);
      this._peerConnection.addStream(mediaStream);
      // re-negotiate the new stream
      this._rtcSession?.renegotiate({ useUpdate: false },
          () => {
          this._setInputMediaStream(mediaStream);
          this._eventEmitter.emit("call.update", { call: this });
        }
      );
    }
  };

  // reset the media event listener
  _removeMediaEventListeners = () => {
    this._eventEmitter.removeListener("video.input.update",
                                       this._videoInputUpdateListener);
  };
}
