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
            <button class="add-button" onClick={() => setShow((prev) => !prev)}>+</button>
          </div>
        </div>
        <div class="progress-column">
          <div class="progress-title">
            <h2>In Progress</h2>
          </div>
          <div class="column-body progress-body">
            <p>In progress body</p>
            <button class="add-button" onClick={() => setShow((prev) => !prev)}>+</button>
          </div>
        </div>
        <div class="upcoming-column">
          <div class="upcoming-title">
            <h2>Upcoming</h2>
          </div>
          <div class="column-body upcoming-body">
            <p>Upcoming body</p>
            <button class="add-button" onClick={() => setShow((prev) => !prev)}>+</button>
          </div>
        </div>
      </div>

      <Portal>
        <Show when={showPopUp()}>
          <div class="popup">
            <div class="popup-body">
              <h2>Create Task</h2>
              <div>
                <label for="title">Title: </label>
                <input type="text" id="title" name="title"></input>
              </div>
              <div>
                <label for="start-date">Start Date: </label>
                <input type="date" name="start-date" id="start-date"/>
              </div>
              <div>
                <label for="end-date">End Date: </label>
                <input type="date" name="end-date" id="end-date"/>
              </div>
              <div>
                <label for="start-time">Start Time: </label>
                <input type="time" name="start-time" id="start-time"/>
              </div>
              <div>
                <label for="end-time">End Time: </label>
                <input type="time" name="end-time" id="end-time"/>
              </div>
              <div>
                <label for="description">Description: </label>
                <textarea name="description" id="description" maxLength="350"></textarea>
              </div>
              <div>
                <label for="task-imporance">Importance Level: </label>
                <select name="task-imporance" id="task-imporance">
                  <option value="level1">Basic</option>
                  <option value="level2">Highlighting</option>
                  <option value="level3">Desktop Notifications</option>
                </select>
              </div>
              <div class="button-container">
              <button class="create-button" onClick={() => setShow((prev) => !prev)}>Create</button>
              <button class="cancel-button" onClick={() => setShow((prev) => !prev)}>Cancel</button>
              </div>
            </div>
          </div>
        </Show>
      </Portal>
      <p>{greetMsg()}</p>
    </main>
  );
}

export default App;
