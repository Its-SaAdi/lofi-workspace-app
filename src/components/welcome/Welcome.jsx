import { useDispatch } from "react-redux";
import { closeWindow } from "../../features/windows/windowSlice";

const INTRO_SCREEN_STORAGE_KEY = "LOFI_WORKSPACE_INTRO_SEEN";

const features = [
    {
        title: "Notes",
        description: "Capture ideas & thoughts",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notebook-icon lucide-notebook"><path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" /><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M16 2v20" /></svg>
        ),
    },
    {
        title: "Todos",
        description: "Keep track of what matters",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-todo-icon lucide-list-todo"><path d="M13 5h8" /><path d="M13 12h8" /><path d="M13 19h8" /><path d="m3 17 2 2 4-4" /><rect x="3" y="4" width="6" height="6" rx="1" /></svg>
        )
    },
    {
        title: "Wallpaper",
        description: "Set the mood for your workspace",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallpaper-icon lucide-wallpaper"><path d="M12 17v4" /><path d="M8 21h8" /><path d="m9 17 6.1-6.1a2 2 0 0 1 2.81.01L22 15" /><circle cx="8" cy="9" r="2" /><rect x="2" y="3" width="20" height="14" rx="2" /></svg>
        )
    },
    {
        title: "Music",
        description: "Listen while you work",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-music-icon lucide-music"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        ),
    },
    {
        title: "Timer",
        description: "Stay focused",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock-icon lucide-clock"><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" /></svg>
        ),
    },
    {
        title: "YouTube",
        description: "Keep YouTube within reach",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
        ),
    },
];

const Welcome = () => {
    const dispatch = useDispatch();

    const finishIntro = () => {
        localStorage.setItem(INTRO_SCREEN_STORAGE_KEY, "true");
        dispatch(closeWindow("welcome"));
    };

    return (
        <div className="w-full text-white">

            {/* Hero */}
            <div className="flex flex-col items-center text-center px-2 pt-1">

                <div className="my-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <span className="text-lg">✦</span>
                </div>

                <h1 className="text-xl font-semibold tracking-tight">
                    Welcome to Lofi Workspace!
                </h1>

                <p className="mt-3 max-w-sm text-sm text-white/95 font-semibold leading-relaxed">
                    Your little space to focus, create, and get things done without the noise.
                </p>

            </div>

            {/* Features */}
            <div className="@container mt-5">
                <div className="grid grid-cols-2 gap-2.5 @min-[600px]:grid-cols-3 @min-[820px]:grid-cols-6">

                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group rounded-xl border border-white/10 bg-white/[0.06] p-3 transition hover:bg-white/[0.1] @min-[400px]:flex @min-[400px]:items-center @min-[400px]:gap-2.5 @min-[400px]:p-2.5"
                        >
                            <div className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/75 @min-[400px]:mb-0">
                                {feature.icon}
                            </div>

                            <div className="@min-[820px]:min-w-0">
                                <h2 className="text-sm font-semibold">
                                    {feature.title}
                                </h2>

                                <p className="mt-0.5 text-[11px] leading-relaxed text-white/80 @min-[820px]:mt-0.5 @min-[820px]:text-[9px] @min-[820px]:truncate">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}

                </div>
            </div>

            {/* Tip */}
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <span className="text-sm">💡</span>
                </div>

                <div>
                    {/* <p className="text-xs font-semibold">
                        A quick tip
                    </p> */}

                    <p className="text-xs italic leading-relaxed text-white/85">
                        Use the taskbar at the bottom to open your tools. Drag, resize, and close windows just like you would on a desktop.
                    </p>
                </div>

            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-center border-t border-white/10 pt-3">
                <button
                    onClick={finishIntro}
                    className="group flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-zinc-900 transition hover:bg-white/90 active:scale-[0.98] hover:cursor-pointer"
                >
                    Let's get started

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform group-hover:translate-x-0.5"
                    >
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                    </svg>
                </button>

            </div>

        </div>
    );
};

export default Welcome;