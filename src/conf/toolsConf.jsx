import Welcome from "../components/welcome/Welcome";
import Notes from "../components/notes/Notes";
// import EnhancedNotes from '../components/notes/EnhancedNotes'
import Timer from "../components/timer/Timer";
import Todo from "../components/todo/Todo";
import Wallpaper from "../components/wallpaper/Wallpaper";
import MusicPlayer from "../components/music/MusicPlayer";
// import MusicPlayer from "../components/music/MusicPlayer2";
import YouTube from "../components/youtube/YouTube";

export const tools = [
    {
        id: "welcome",
        title: "Welcome",
        component: <Welcome />
    },
    {
        id: "notes",
        title: "Notes",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notebook-icon lucide-notebook"><path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" /><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M16 2v20" /></svg>
        ),
        component: <Notes />,
    },
    {
        id: "todos",
        title: "Todos",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-todo-icon lucide-list-todo"><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><rect x="3" y="4" width="6" height="6" rx="1"/></svg>
        ),
        component: <Todo />,
    },
    {
        id: "wallpaper",
        title: "Wallpaper",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallpaper-icon lucide-wallpaper"><path d="M12 17v4" /><path d="M8 21h8" /><path d="m9 17 6.1-6.1a2 2 0 0 1 2.81.01L22 15" /><circle cx="8" cy="9" r="2" /><rect x="2" y="3" width="20" height="14" rx="2" /></svg>
        ),
        component: <Wallpaper />,
    },
    {
        id: "music",
        title: "Music",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-music-icon lucide-music"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        ),
        component: <MusicPlayer />,
    },
    {
        id: "timer",
        title: "Timer",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock-icon lucide-clock"><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" /></svg>
        ),
        component: <Timer />,
    },
    {
        id: "yt",
        title: "Youtube",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
        ),
        component: <YouTube />,
    },
];