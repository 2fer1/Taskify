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
import { batch } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createSortable,
  createDroppable,
  closestCenter,
  transformStyle,
} from "@thisbeyond/solid-dnd";
import { useDragDropContext } from "@thisbeyond/solid-dnd";
// import { closestCenter } from "@thisbeyond/solid-dnd";

function Sortable(props){
  const sortable = createSortable(props.item);
  return (
    <div
      use:sortable
      class="sortable"
      classList={{
        "opacity-25": sortable.isActiveDraggable,
      }}
    >
      {props.item}
    </div>
  );
}

function Column(props){
  const droppable = createDroppable(props.id);
  return(
    <div use:droppable class="column">
      <SortableProvider ids={props.items}>
        <For each={props.items}>{(item) => <Sortable item={item}/>}</For>
      </SortableProvider>
    </div>
  )
}

function App() {
  const [showPopUp, setShow] = createSignal(false);
  const [showTask, setTaskShow] = createSignal(false);
  const [greetMsg, setGreetMsg] = createSignal("");
  const [chosenColumn, setColumn] = createSignal("");
  const [taskId, setTaskId] = createSignal("");

  const [taskStore, setStore] = createStore({});

  //const id = createUniqueId();

  let title;
  let start;
  let end;
  let description;
  let importance;

  const [containers, setContainers] = createStore({
    A: [1, 2, 3],
    B: [4, 5, 6],
  });

  const containerIds = () => Object.keys(containers);
  const isContainer = (id) => containerIds().includes(id);

  function getContainer(id){
    for (const [key, items] of Object.entries(containers)){
      if (items.includes(id)){
        return key;
      }
    }
  };

  function closestContainerOrItem(draggable, droppables, context){
    const closestContainer = closestCenter(
      draggable,
      droppables.filter((droppable) => isContainer(droppable.id)),
      context
    );
    if (closestContainer) {
      const containerItemIds = containers[closestContainer.id];
      const closestItem = closestCenter(
        draggable,
        droppables.filter((droppable) =>
          containerItemIds.includes(droppable.id)
        ),
        context
      );
      if (!closestItem) {
        return closestContainer;
      }

      if (getContainer(draggable.id) != closestContainer.id){
        const isLastItem =
          containerItemIds.indexOf(closestItem.id) == containerItemIds.length -1;

        if (isLastItem) {
          const belowLastItem =
            draggable.transformed.center.y > closestItem.transformed.center.y;
          
          if (belowLastItem) {
            return closestContainer;
          }
        }
      }
      return closestItem;
    }
  };

  function move(draggable, droppable, onlyWhenChangingContainer = true){
    const draggableContainer = getContainer(draggable.id);
    const droppableContainer = isContainer(droppable.id)
      ? droppable.id
      : getContainer(droppable.id);
    
    if (
      draggableContainer != droppableContainer ||
      !onlyWhenChangingContainer
    ){
      const containerItemIds = containers[droppableContainer];
      let index = containerItemIds.indexOf(droppable.id);
      if (index == -1) index = containerItemIds.length;

      batch(() => {
        setContainers(draggableContainer, (items) => 
          items.filter((item) => item != draggable.id)
        );
        setContainers(droppableContainer, (items) => [
          ...items.slice(0, index),
          draggable.id,
          ...items.slice(index),
        ]);
      });
    }
  };

  function onDragOver({draggable, droppable}){
    if (draggable && droppable){
      move(draggable, droppable);
    }
  };

  function onDragEnd(draggable, droppable){
    if (draggable && droppable){
      move(draggable, droppable, false);
    }
  };

  function TaskInfo({task}){
    return(
      <div class="popup-body">
        <button class="close-button" onClick={() => setTaskShow((prev) => !prev)}>⨉</button>
        <h2>{task.title}</h2>
        <div>
          <p>From: {task.start.toLocaleString()}</p>
          <p>To: {task.end.toLocaleString()}</p>
        </div>
        <p class="task-description">{task.description}</p>
      </div>
    )
  }

  function deleteTask(taskId){
    setTaskId(taskId);
    setStore(taskId, undefined);
  }

  function clickDiv(taskId){
    console.log("Div was clicked!");
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
    setStore(curId, task);
    setShow((prev) => !prev);
  }

  return (
    <main>
      <div class="top-row self-stretch">
        <p>Taskify</p>
        <DragDropProvider
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          collisionDetector={closestContainerOrItem}
        >
          <DragDropSensors/>
          <div class="columns">
            <For each={containerIds()}>
              {(key) => <Column id={key} items={containers[key]}/>}
            </For>
          </div>
          <DragOverlay>
            {(draggable) => <div class="sortable">{draggable.id}</div>}
          </DragOverlay>
        </DragDropProvider>
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
                {(task) => 
                  (<li>
                    <div class="task-body">
                      <div  onClick={() => clickDiv(task.id)}>
                        <h3 class="task-title">{task.title}</h3>
                        <div class="task-date">
                          <p>{task.start.toLocaleString()}</p>
                          <p>to</p>
                          <p>{task.end.toLocaleString()}</p>
                        </div>
                      </div>
                      <button class="delete-button" onClick={() => deleteTask(task.id)}>🗑</button>
                    </div>
                  </li>)}
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
                {(task) => 
                  (<li>
                    <div class="task-body">
                      <div  onClick={() => clickDiv(task.id)}>
                        <h3 class="task-title">{task.title}</h3>
                        <div class="task-date">
                          <p>{task.start.toLocaleString()}</p>
                          <p>to</p>
                          <p>{task.end.toLocaleString()}</p>
                        </div>
                      </div>
                      <button class="delete-button" onClick={() => deleteTask(task.id)}>🗑</button>
                    </div>
                  </li>)}
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
                {(task) => 
                  (<li>
                    <div class="task-body">
                      <div  onClick={() => clickDiv(task.id)}>
                        <h3 class="task-title">{task.title}</h3>
                        <div class="task-date">
                          <p>{task.start.toLocaleString()}</p>
                          <p>to</p>
                          <p>{task.end.toLocaleString()}</p>
                        </div>
                      </div>
                      <button class="delete-button" onClick={() => deleteTask(task.id)}>🗑</button>
                    </div>
                  </li>)}
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
            <div class="popup-body">
              <h2>Create Task</h2>
              <div>
                <label for="title">Title: </label>
                <input type="text" id="title" name="title" maxLength="75" ref={title}></input>
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
                <textarea name="description" id="description" maxLength="350" rows="5" ref={description}></textarea>
              </div>
              <div>
                <label for="task-importance">Importance Level: </label>
                <select name="task-importance" id="task-importance" ref={importance}>
                  <option value="level1">Basic</option>
                  <option value="level2">Highlighting</option>
                  <option value="level3">Desktop Notifications</option>
                </select>
              </div>
              <div class="button-container">
                <button class="create-button" onClick={() => createTask()}>Create</button>
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
