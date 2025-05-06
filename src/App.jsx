import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Portal } from "solid-js/web";

function App() {
  const [showPopUp, setShow] = createSignal(false);
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
      </div>
      <div class="category-columns">
        <div class="completed-column">
          <div class="completed-title">
            <h2>Completed</h2>
          </div>
          <div class="column-body completed-body">
            <p>Completed body</p>
            <button class="create-button" onClick={() => setShow((prev) => !prev)}>+</button>
          </div>
        </div>
        <div class="progress-column">
          <div class="progress-title">
            <h2>In Progress</h2>
          </div>
          <div class="column-body progress-body">
            <p>In progress body</p>
            <button class="create-button" onClick={() => setShow((prev) => !prev)}>+</button>
          </div>
        </div>
        <div class="upcoming-column">
          <div class="upcoming-title">
            <h2>Upcoming</h2>
          </div>
          <div class="column-body upcoming-body">
            <p>Upcoming body</p>
            <button class="create-button" onClick={() => setShow((prev) => !prev)}>+</button>
          </div>
        </div>
      </div>

      <Portal>
        <Show when={showPopUp()}>
          <div class="popup">
            <div class="popup-body">
              <p>Portal</p>
            </div>
          </div>
        </Show>
      </Portal>
      <p>{greetMsg()}</p>
    </main>
  );
}

export default App;
