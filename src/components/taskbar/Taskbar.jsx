import { tools } from '../../conf/toolsConf';
import { useDispatch, useSelector } from "react-redux";
import { openWindow, minimizeWindow, focusWindow } from "../../features/windows/windowSlice"

const Taskbar = () => {
    const dispatch = useDispatch();
    const windows = useSelector(state => state.win.windows);

    const handleToolClick = (tool) => {
        const existing = windows.find(win => win.id === tool.id);

        if (!existing) {
            // Open a new window if it doesn’t exist
            dispatch(
                openWindow({
                    id: tool.id,
                    toolName: tool.title,
                    element: tool.title,
                })
            );
        } else if (existing.isMinimized) {
            // Restore minimized window (focus + un-minimize)
            dispatch(focusWindow(tool.id));
        } else {
            // If already open and visible, minimize it
            dispatch(minimizeWindow(tool.id));
        }
    }

    return (
        <div className="w-full flex justify-center">
            <div id="taskbar" className="absolute bottom-5 mx-auto z-50 flex h-16 items-center justify-center space-x-3 p-2 px-3 backdrop-blur-xs bg-white/10 rounded-2xl shadow-lg border border-white/10">

                {tools.map((tool) => {
                    const window = windows.find(win => win.id === tool.id);
                    const isActive = window && !window.isMinimized;
                    const isMinimized = window && window.isMinimized;

                    if (tool.id === 'welcome') return

                    return (
                        <div key={tool.id} className='relative group'>

                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-md bg-black/50 text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 whitespace-nowrap after:content-[''] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black/50">
                                {tool.title}
                            </span>

                            <button
                                // title={tool.title}
                                onClick={() => handleToolClick(tool)}
                                className={`flex flex-col items-center justify-center rounded-lg p-2 text-white text-xl transition-all duration-200 cursor-pointer ${isActive ? "bg-white/20 scale-105 " : "active:scale-95 hover:bg-white/10"}`}
                            >
                                {tool.icon}
                                {isMinimized && (
                                    <div className="mt-1 h-1 w-1 rounded-full bg-white"></div>
                                )}
                            </button>

                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Taskbar