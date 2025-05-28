import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Portal } from "solid-js/web";
import Task from "./Classes/task";
import { createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { createUniqueId } from "solid-js";
import { dataDir } from "@tauri-apps/api/path";
import {For} from "solid-js";
import trashIcon from "./assets/trash-solid.svg";



function App() {
  const [showPopUp, setShow] = createSignal(false);
  const [showTask, setTaskShow] = createSignal(false);
  const [chosenColumn, setColumn] = createSignal("");
  const [taskId, setTaskId] = createSignal("");

  const [taskStore, setStore] = createStore({});

  //const id = createUniqueId();

  let title;
  let start;
  let end;
  let description;
  let importance;


  function TaskInfo({task}){
    return(
      <div class="popup-body">
        <button class="close-button" onClick={() => setTaskShow((prev) => !prev)}>⨉</button>
        <h2>{task.title}</h2>
        <div>
          <p>From: {task.printedStart}</p>
          <p>To: {task.printedEnd}</p>
        </div>
        <p class="task-description">{task.description}</p>
      </div>
    )
  }

  function TaskItem({task}){
    return(
    <div class="task-body" classList={{taskhighlight: task.importance != 1}}>
      <div onClick={() => clickDiv(task.id)}>
        <h3 class="task-title">{task.title}</h3>
        <div class="task-date">
          <p>{task.printedStartShort} - {task.printedEndShort}</p>
        </div>
      </div>
      <button class="delete-button" onClick={() => deleteTask(task.id)}><img src={trashIcon}></img></button>
    </div>
    )
  }

  function deleteTask(taskId){
    setTaskId(taskId - 1);
    setStore(taskId, undefined);
  }

  function clickDiv(taskId){
    setTaskId(taskId);
    setTaskShow((prev) => !prev);
  }

  function changeColumn(column){
    setColumn(column);
    setShow((prev) => !prev);
  }

  function createTask(){
    let curId = createUniqueId();
    const task = new Task(curId, chosenColumn(), title.value, start.value, end.value, description.value, importance.value);

    title = start = end = description = importance = undefined;

    setStore(curId, task);
    setShow((prev) => !prev);
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
            <button class="add-button" onClick={() => changeColumn("completed")}>+</button>
            <ol class="task-container">
              <For each={Object.values(taskStore).filter((task) => task.type == "completed")}>
                {(task) => (
                  <Show when={task.importance == 3}>
                    <TaskItem task={task}/>
                  </Show>
                )}
              </For>
              <For each={Object.values(taskStore).filter((task) => task.type == "completed")}>
                {(task) => (
                  <Show when={task.importance == 2}>
                    <TaskItem task={task}/>
                  </Show>
                )}
              </For>
              <For each={Object.values(taskStore).filter((task) => task.type == "completed")}>
                {(task) => (
                  <Show when={task.importance == 1}>
                    <TaskItem task={task}/>
                  </Show>
                )}
              </For>
            </ol>
          </div>
        </div>
        <div class="progress-column">
          <div class="progress-title">
            <h2>In Progress</h2>
          </div>
          <div class="column-body progress-body">
            <button class="add-button" onClick={() => changeColumn("inProgress")}>+</button>

            <ol class="task-container">
               <For each={Object.values(taskStore).filter((task) => task.type == "inProgress")}>
                {(task) => (
                  <TaskItem task={task}/>
                )}
              </For>
            </ol>
          </div>
        </div>
        <div class="upcoming-column">
          <div class="upcoming-title">
            <h2>Upcoming</h2>
          </div>
          <div class="column-body upcoming-body">
            <button class="add-button" onClick={() => changeColumn("upcoming")}>+</button>

            <ol class="task-container">
               <For each={Object.values(taskStore).filter((task) => task.type == "upcoming")}>
                {(task) => (
                  <TaskItem task={task}/>
                )}
              </For>
            </ol>
          </div>
        </div>
      </div>

      <Portal>
        <Show when={showTask()}>
          <div class="popup">
            <TaskInfo task={taskStore[taskId()]}/>
          </div>
        </Show>
      </Portal>

      <Portal>
        <Show when={showPopUp()}>
          <div class="popup">
            <form>
              <div class="popup-body">
                <h2>Create Task</h2>
                <div>
                  <label for="title">Title: </label>
                  <input type="text" id="title" name="title" maxLength="75" ref={title} required></input>
                </div>
                <div>
                  <label for="start">Start Date/Time: </label>
                  <input type="datetime-local" name="start" id="start" value={"2025-05-20T08:30"} ref={start} />
                </div>
                <div>
                  <label for="end-date">End Date/Time: </label>
                  <input type="datetime-local" name="end" id="end" value={"2025-05-20T08:30"} ref={end}/>
                </div>
                <div class="description-field">
                  <label for="description">Description: </label>
                  <textarea name="description" id="description" maxLength="350" rows="5" ref={description} required></textarea>
                </div>
                <div>
                  <label for="task-importance">Importance Level: </label>
                  <select name="task-importance" id="task-importance" ref={importance}>
                    <option value="1">Basic</option>
                    <option value="2">Highlighting</option>
                    <option value="3">Desktop Notifications</option>
                  </select>
                </div>
                <div class="button-container">
                  <input type="submit" class="create-button" onClick={() => createTask()}>Create</input>
                  <button class="cancel-button" onClick={() => setShow((prev) => !prev)}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </Show>
      </Portal>
    </main>
  );
}

export default App;
