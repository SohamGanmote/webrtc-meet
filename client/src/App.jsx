import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreateMeeting from "./pages/CreateMeeting";
import VideoChat from "./pages/VideoChat";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<CreateMeeting />} />
				<Route path="/video/:roomCode" element={<VideoChat />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
