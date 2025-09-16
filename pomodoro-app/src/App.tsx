import { useEffect, useState } from "react";
import PomodoroTimer from "./PomodoroTimer";

type Task = {
  id: string;
  content: string;
};

const doryImages = [
  "https://lumiere-a.akamaihd.net/v1/images/finding-dory-584ba1ee2d044_4fdcf2ff.jpeg",
  "https://i.ytimg.com/vi/3JNLwlcPBPI/maxresdefault.jpg",
  "https://upload.wikimedia.org/wikipedia/en/3/3e/Finding_Dory.jpg",
  "https://www.disneyclips.com/images/images/finding-dory-destiny.jpg",
];

const randomDory = doryImages[Math.floor(Math.random() * doryImages.length)];
const TODOIST_API_TOKEN = import.meta.env.VITE_TODOIST_API_TOKEN;

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetch("https://api.todoist.com/rest/v2/tasks", {
      headers: {
        Authorization: `Bearer ${TODOIST_API_TOKEN}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Error fetching tasks:", err));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fullscreen background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${randomDory})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Optional blur/dark overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-0" />

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white px-4 space-y-10">
        <PomodoroTimer />

        <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md w-full max-w-md text-center">
          <h2 className="text-lg font-medium mb-2">{greeting}, Dory</h2>
          <p className="text-sm mb-3 text-white/80">
            What are you working on right now?
          </p>

          <select
            className="w-full p-2 rounded bg-white/80 text-black focus:outline-none"
            onChange={(e) => {
              const task = tasks.find((t) => t.id === e.target.value);
              setSelectedTask(task ?? null);
            }}
          >
            <option value="">-- Choose a task --</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.content}
              </option>
            ))}
          </select>

          {selectedTask && (
            <p className="mt-3 text-white/90">
              Focusing on: <strong>{selectedTask.content}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}