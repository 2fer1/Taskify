import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name: name() }));
  }

  return (
    <main>
      <div class="top-row">
        <p>Taskify</p>
        <button class="create-button" type="button">Create +</button>
      </div>
      <div class="main-body">
        <div>
          <h2 class="completed category-title">Completed</h2>
        </div>
        <div>
          <h2 class="in-progress category-title">In Progress</h2>
        </div>
        <div>
          <h2 class="upcoming category-title">Upcoming</h2>
        </div>
      </div>
      <p>{greetMsg()}</p>
    </main>
  );
}

export default App;
