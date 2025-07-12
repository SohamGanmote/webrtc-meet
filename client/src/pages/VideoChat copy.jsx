// src/VideoChat.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import { Mic, MicOff, Video, VideoOff, Phone, Copy } from "lucide-react";

const socket = io();

export default function VideoChat() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceQueue = useRef([]);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const [remoteConnected, setRemoteConnected] = useState(false);


  useEffect(() => {
    const setup = async () => {
      await initCamera();
      socket.emit("join-room", roomCode);

      socket.on("ready", async () => {
        setRemoteConnected(true);

        if (!localStreamRef.current) return;
        const peer = createPeer();
        peerRef.current = peer;
        if (!localStreamRef.current) return;
        localStreamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current);
        });
      });

      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("candidate", handleCandidate);
    };

    setup();

    return () => {
      socket.off("ready");
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("candidate", handleCandidate);
    };
  }, []);


  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      localVideoRef.current.srcObject = stream;
      localStreamRef.current = stream;
    } catch (err) {
      alert(`Camera error: ${err.name} - ${err.message}`);
    }
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, {
        urls: "turn:182.70.124.187:3478",
        username: "fezzy",
        credential: "fezzy",
      },],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("candidate", { room: roomCode, data: e.candidate });
      }
    };

    peer.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    peer.onnegotiationneeded = async () => {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer", { room: roomCode, data: offer });
    };

    peer.onconnectionstatechange = () => {
      if (["disconnected", "closed", "failed"].includes(peer.connectionState)) {
        remoteVideoRef.current.srcObject = null;
        setRemoteConnected(false);
      }
    };

    return peer;
  };

  const handleToggleMic = () => {
    setMicOn((prev) => {
      localStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = !prev));
      return !prev;
    });
  };

  console.log(camOn)

  const handleToggleCamera = () => {
    setCamOn((prev) => {
      localStreamRef.current
        .getVideoTracks()
        .forEach((track) => (track.enabled = !prev));
      return !prev;
    });
  };

  const handleEndCall = () => {
    if (peerRef.current) {
      peerRef.current
        .getSenders()
        .forEach((sender) => peerRef.current.removeTrack(sender));
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      if (!localStreamRef.current) return;
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    iceQueue.current = [];

    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const handleOffer = async ({ data }) => {
    if (!data) return;

    setRemoteConnected(true);

    if (!peerRef.current) {
      const peer = createPeer();
      peerRef.current = peer;
      localStreamRef.current
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStreamRef.current));
    }

    await peerRef.current.setRemoteDescription(new RTCSessionDescription(data));
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit("answer", { room: roomCode, data: answer });

    iceQueue.current.forEach((c) => peerRef.current.addIceCandidate(c));
    iceQueue.current = [];
  };

  const handleAnswer = async ({ data }) => {
    if (!data) return;
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(data));
  };

  const handleCandidate = async ({ data }) => {
    if (!data) return;
    const ice = new RTCIceCandidate(data);
    if (peerRef.current?.remoteDescription) {
      await peerRef.current.addIceCandidate(ice);
    } else {
      iceQueue.current.push(ice);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Full Screen Video Grid */}
      <div className="h-screen grid grid-cols-1 md:grid-cols-2">
        {/* 
          ! Dev Note
          Temp Fix: Instead of unmounting the <video> element, we're using CSS to hide/show it.
          This avoids disrupting the video stream, which was causing issues in WebRTC.
          Problem: When turning the camera off and then on again, the video sometimes stays black.
          Cause: The video track is not always rendering properly after re-enabling.
          TODO: Investigate if the video track needs to be replaced or re-acquired when re-enabling.
        */}

        {/* Local Video */}
        <div className="relative overflow-hidden bg-gray-50 border rounded-none h-full w-full">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover bg-black ${camOn ? "block" : "hidden"}`}
          />
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-gray-800 bg-gray-100 ${camOn ? "hidden" : "flex"}`}>
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-semibold text-white">ME</span>
            </div>
            <p className="text-lg font-medium">You</p>
            <p className="text-sm text-gray-600">Camera Off</p>
          </div>
          <div className="absolute top-4 left-4 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-300 shadow-sm">
            You
          </div>
          {!micOn && (
            <div className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg">
              <MicOff className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Remote Video */}
        {remoteConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover bg-black"
          />
        ) : (
          <div className={`inset-0 flex flex-col items-center justify-center text-gray-800 bg-gray-100`}>
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-semibold text-white">RE</span>
            </div>
            <p className="text-lg font-medium">Remote</p>
            <p className="text-sm text-gray-600">Waiting for other user to join...</p>
          </div>
        )}
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-2xl border border-gray-200">
          <div className="flex justify-center items-center gap-2">
            {/* Mic Button */}
            <button
              onClick={handleToggleMic}
              className="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-900  rounded-full w-12 h-12 shadow-lg cursor-pointer"
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}

            </button>

            {/* Camera Button */}
            <button
              onClick={handleToggleCamera}
              className="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-900  rounded-full w-12 h-12 shadow-lg cursor-pointer"
            >
              {camOn ? <Video size={18} /> : <VideoOff size={18} />}

            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white  rounded-full w-12 h-12 shadow-lg cursor-pointer"
            >
              <Phone size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Room Code */}
      <div className="absolute bottom-[110px] left-1/2 transform -translate-x-1/2 z-10 text-sm cursor-pointer">
        <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-2xl border border-gray-200 flex items-center gap-2">
          <button onClick={() => navigator.clipboard.writeText(roomCode)} title="Copy Room Code">
            <Copy size={16} className="text-gray-700 hover:text-black" />
          </button>
          <span>{roomCode}</span>
        </div>
      </div>
    </div>
  );
}