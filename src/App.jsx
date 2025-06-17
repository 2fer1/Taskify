import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Portal } from "solid-js/web";
import Task from "./Classes/task";
import { createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { createUniqueId } from "solid-js";
import { dataDir } from "@tauri-apps/api/path";
import { For } from "solid-js";
import trashIcon from "./assets/trash-solid.svg";
import unPinnedIcon from "./assets/pin-notpinned.svg";
import pinnedIcon from "./assets/pin-pinned.svg";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createEffect } from "solid-js";
const {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} = window.__TAURI__.notification;
const { load } = window.__TAURI__.store;
import sureAudio from "./assets/Are-You-Sure-Trimmed.mp3";
import prettySureAudio from "./assets/Pretty-Sure.mp3";

// Do you have permission to send a notification?
let permissionGranted = await isPermissionGranted();

// If not we need to request it
if (!permissionGranted) {
  const permission = await requestPermission();
  permissionGranted = permission === "granted";
}

const taskFile = await load("tasks.json", { autoSave: false });

await taskFile.save();

function App() {
  const [showPopUp, setShow] = createSignal(false);
  const [showTask, setTaskShow] = createSignal(false);
  const [chosenColumn, setColumn] = createSignal("");
  const [taskId, setTaskId] = createSignal("");
  const [titleError, setTitleError] = createSignal(false);
  const [descError, setDescError] = createSignal(false);
  const [windowPin, setWindowPin] = createSignal(false);
  const [deleteWindow, setDeleteWindow] = createSignal(false);

  const [taskStore, setStore] = createStore({});

  createEffect(async () => {
    for (const item of await taskFile.entries()) {
      const tempTask = new Task(
        item[1].id,
        item[1].type,
        item[1].title,
        item[1].start,
        item[1].end,
        item[1].description,
        item[1].importance,
        item[1].notified
      );
      setStore(item[1].id, tempTask);
    }
  });

  const id = createUniqueId();

  const threeDaysAgo = Date.now() - 3 * 86400000;

  let question;
  let answer;

  let title = undefined;
  let start;
  let end;
  let description = undefined;
  let importance;

  createEffect(async () => {
    for (let task in taskStore) {
      let curTask = taskStore[task];
      if (
        curTask.importance == 3 &&
        curTask.startInEpoch > threeDaysAgo &&
        curTask.notified == false
      ) {
        sendNotification({
          title: curTask.title,
          body: "This task starts " + curTask.printedStart,
        });
        curTask.notified = true;
      }
    }
  });

  createEffect(async () => {
    await getCurrentWindow().setAlwaysOnTop(windowPin());
  });

  function TaskInfo({ task }) {
    return (
      <div class="popup-body">
        <button
          class="close-button"
          onClick={() => setTaskShow((prev) => !prev)}
        >
          ⨉
        </button>
        <h2>{task.title}</h2>
        <div>
          <p>From: {task.printedStart}</p>
          <p>To: {task.printedEnd}</p>
        </div>
        <p class="task-description">{task.description}</p>
      </div>
    );
  }

  function TaskItem({ task }) {
    return (
      <div
        class="task-body"
        classList={{ taskhighlight: task.importance == 2, taskhighlightextra: task.importance == 3 }}
      >
        <div class="arrows">
          <button onClick={() => moveTask(task.id, "left")}>←</button>
          <button onClick={() => moveTask(task.id, "right")}>→</button>
        </div>
        <div onClick={() => clickDiv(task.id)}>
          <h3 class="task-title">{task.title}</h3>
          <div class="task-date">
            <p>
              {task.printedStartShort} - {task.printedEndShort}
            </p>
          </div>
        </div>
        <button class="delete-button" onClick={() => maybeDelete(task.id)}>
          <img src={trashIcon}></img>
        </button>
      </div>
    );
  }

  function moveTask(taskId, direction) {
    let tempTask = new Task(
      taskStore[taskId].id,
      taskStore[taskId].type,
      taskStore[taskId].title,
      taskStore[taskId].start,
      taskStore[taskId].end,
      taskStore[taskId].description,
      taskStore[taskId].importance,
      taskStore[taskId].notified
    )

    setStore(taskId, undefined);
    taskFile.delete(taskId);

    if (direction == "left") {
      if (tempTask.type == "completed") {
        tempTask.type = "upcoming";
        setStore(taskId, tempTask);
      } else if (tempTask.type == "inProgress") {
        tempTask.type = "completed";
        setStore(taskId, undefined);
        setStore(taskId, tempTask);
      } else {
        tempTask.type = "inProgress";
        setStore(taskId, undefined);
        setStore(taskId, tempTask);
      }
    } else {
      if (tempTask.type == "completed") {
        tempTask.type = "inProgress";
        setStore(taskId, undefined);
        setStore(taskId, tempTask);
      } else if (tempTask.type == "inProgress") {
        tempTask.type = "upcoming";
        setStore(taskId, undefined);
        setStore(taskId, tempTask);
      } else {
        tempTask.type = "completed";
        setStore(taskId, undefined);
        setStore(taskId, tempTask);
      }
    }

      taskFile.set(taskId, {
        id: tempTask.id,
        type: tempTask.type,
        title: tempTask.title,
        start: tempTask.start,
        end: tempTask.end,
        description: tempTask.description,
        importance: tempTask.importance,
        notified: tempTask.notified,
      });
      taskFile.save();
  }

  function deleteTask(taskId) {
    setTaskId(taskId - 1);
    setStore(taskId, undefined);
    setDeleteWindow(false);
    taskFile.delete(taskId);
    question.pause();
    question.currentTime = 0;
    answer.play();
  }

  function clickDiv(taskId) {
    setTaskId(taskId);
    setTaskShow((prev) => !prev);
  }

  function maybeDelete(taskId) {
    setTaskId(taskId);
    setDeleteWindow(true);
    question.play();
  }

  function cancelDelete(){
    setDeleteWindow(false);
    question.pause();
    question.currentTime = 0;
  }

  function changeColumn(column) {
    setColumn(column);
    setShow((prev) => !prev);
  }

  function createTask() {
    if (title.value == "") {
      setTitleError(true);
    } else {
      setTitleError(false);
    }

    if (description.value == "") {
      setDescError(true);
    } else {
      setDescError(false);
    }

    if (title.value != "" && description.value != "") {
      // let curId = createUniqueId();
      let uuid = self.crypto.randomUUID();
      const task = new Task(
        uuid,
        chosenColumn(),
        title.value,
        start.value,
        end.value,
        description.value,
        importance.value,
      );

      title = start = end = description = importance = undefined;

      setStore(uuid, task);

      taskFile.set(uuid, {
        id: task.id,
        type: task.type,
        title: task.title,
        start: task.start,
        end: task.end,
        description: task.description,
        importance: task.importance,
        notified: task.notified,
      });
      taskFile.save();

      setShow((prev) => !prev);
      setTitleError(false);
      setDescError(false);
    }
  }

  function cancelCreate() {
    setTitleError(false);
    setDescError(false);
    setShow((prev) => !prev);
  }

  function windowPinner() {
    setWindowPin((prev) => !prev);
  }

  return (
    <main>
      <div class="top-row">
        <audio loop src={sureAudio} ref={question}></audio>
        <audio src={prettySureAudio} ref={answer}></audio>
        <button onClick={() => windowPinner()} class="pin-button">
          {<img src={windowPin() ? pinnedIcon : unPinnedIcon}></img>}
        </button>
      </div>
      <div class="category-columns">
        <div class="completed-column">
          <div class="column-title completed">
            <h2>Completed</h2>
          </div>
          <div class="column-body completed-body">
            <ol class="task-container">
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "completed"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 3}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "completed"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 2}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "completed"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 1}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
            </ol>
            <button
              class="add-button"
              onClick={() => changeColumn("completed")}
            >
              +
            </button>
          </div>
        </div>
        <div class="progress-column">
          <div class="column-title progress">
            <h2>In Progress</h2>
          </div>
          <div class="column-body progress-body">
            <ol class="task-container">
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "inProgress"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 3}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "inProgress"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 2}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "inProgress"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 1}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
            </ol>
            <button
              class="add-button"
              onClick={() => changeColumn("inProgress")}
            >
              +
            </button>
          </div>
        </div>
        <div class="upcoming-column">
          <div class="column-title upcoming">
            <h2>Upcoming</h2>
          </div>
          <div class="column-body upcoming-body">
            <ol class="task-container">
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "upcoming"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 3}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "upcoming"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 2}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
              <For
                each={Object.values(taskStore).filter(
                  (task) => task.type == "upcoming"
                )}
              >
                {(task) => (
                  <Show when={task.importance == 1}>
                    <TaskItem task={task} />
                  </Show>
                )}
              </For>
            </ol>
            <button class="add-button" onClick={() => changeColumn("upcoming")}>
              +
            </button>
          </div>
        </div>
      </div>

      <Portal>
        <Show when={deleteWindow()}>
          <div class="popup">
            <div class="delete-window">
              <h2>Delete</h2>
              <p>Are you sure you want to delete this task?</p>
              <div>
                <button
                  class="delete-cancel"
                  onClick={() => cancelDelete()}
                >
                  Cancel
                </button>
                <button
                  class="delete-confirm"
                  onClick={() => deleteTask(taskId())}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Show>
      </Portal>

      <Portal>
        <Show when={showTask()}>
          <div class="popup">
            <TaskInfo task={taskStore[taskId()]} />
          </div>
        </Show>
      </Portal>

      <Portal>
        <Show when={showPopUp()}>
          <div class="popup">
            <div class="popup-body">
              <h2>Create Task</h2>
              <div class="title-field">
                <label for="title">Title: </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  maxLength="75"
                  ref={title}
                  classList={{ fieldErr: titleError() == true }}
                ></input>
                <Show when={titleError() == true}>
                  <p class="error-message">This field is required.</p>
                </Show>
              </div>
              <div>
                <label for="start">Start Date/Time: </label>
                <input
                  type="datetime-local"
                  name="start"
                  id="start"
                  value={"2025-05-20T08:30"}
                  ref={start}
                />
              </div>
              <div>
                <label for="end-date">End Date/Time: </label>
                <input
                  type="datetime-local"
                  name="end"
                  id="end"
                  value={"2025-05-20T08:30"}
                  ref={end}
                />
              </div>
              <div class="description-field">
                <label for="description">Description: </label>
                <textarea
                  name="description"
                  id="description"
                  maxLength="350"
                  rows="5"
                  ref={description}
                  classList={{ fieldErr: descError() == true }}
                ></textarea>
                <Show when={descError() == true}>
                  <p class="error-message">This field is required.</p>
                </Show>
              </div>
              <div>
                <label for="task-importance">Importance Level: </label>
                <select
                  name="task-importance"
                  id="task-importance"
                  ref={importance}
                >
                  <option value="1">Basic</option>
                  <option value="2">Highlighting</option>
                  <option value="3">Desktop Notifications</option>
                </select>
              </div>
              <div class="button-container">
                <button class="create-button" onClick={() => createTask()}>
                  Create
                </button>
                <button class="cancel-button" onClick={() => cancelCreate()}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Show>
      </Portal>
    </main>
  );
}

export default App;
