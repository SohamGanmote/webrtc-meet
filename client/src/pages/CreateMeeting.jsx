import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Users } from "lucide-react";

export default function CreateMeeting() {
  const [inputRoomCode, setInputRoomCode] = useState("");
  const navigate = useNavigate();

  const generateRoomCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateMeeting = () => {
    const roomCode = generateRoomCode();
    navigate(`/video/${roomCode}`);
  };

  const handleJoinMeeting = () => {
    if (!inputRoomCode.trim()) return alert("Enter a room code");
    navigate(`/video/${inputRoomCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center sm:bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl sm:shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-semibold text-gray-800">
            <Video className="h-6 w-6" />
            Meeting
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Start a new meeting or join an existing one
          </p>
        </div>

        {/* Create Meeting Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateMeeting}
            className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white font-medium rounded-lg h-12 text-base"
          >
            <Users className="h-5 w-5" />
            Create Meeting
          </button>
        </div>

        {/* Separator */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        {/* Join Meeting Form */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="meeting-code"
              className="block text-sm font-medium text-gray-700"
            >
              Meeting Code
            </label>
            <input
              id="meeting-code"
              type="text"
              placeholder="Enter meeting code"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleJoinMeeting}
            className="w-full bg-white text-black border border-black hover:bg-gray-100 font-medium rounded-lg h-12 text-base"
            disabled={!inputRoomCode.trim()}
          >
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
