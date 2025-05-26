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
import { onMount } from "solid-js";
import {VoidComponent} from "solid-js";
import { batch } from "solid-js";
import Big from "big.js";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createSortable,
  createDroppable,
  closestCenter,
  maybeTransformStyle,
  transformStyle,
} from "@thisbeyond/solid-dnd";
import { useDragDropContext } from "@thisbeyond/solid-dnd";
// import { closestCenter } from "@thisbeyond/solid-dnd";

export const ORDER_DELTA = 1000;

function sortByOrder(entities){
  const sorted = entities.map((item) => ({ order: new Big(item.order), item}));
  sorted.sort((a,b) => a.order.cmp(b.order));
  return sorted.map((entry) => entry.item);
}

function Item(props){
  const sortable = createSortable(props.id);
  return(
    <div
    use:sortable
    class="sortable"
    classList={{"opacity-25": sortable.isActiveDraggable}}
    >
      {props.name}
    </div>
  )
}

function ItemOverlay(props){
  return <div class="sortable">{props.name}</div>
}

function Group(props){
  const sortable = createSortable(props.id);
  const sortedItemIds = () => props.items.map((item) => item.id);

  return(
    <div
      ref={sortable.ref}
      style={maybeTransformStyle(sortable.transform)}
      classList={{ "opacity-25": sortable.isActiveDraggable}}
    >
      <div {...sortable.dragActivators}>
        {props.name}
      </div>
      <div class="column">
        <SortableProvider ids={sortedItemIds()}>
          <For each={props.items}>
            {(item) => (
              <Item id={item.id} name={item.name} group={item.group}/>
            )}
          </For>
        </SortableProvider>
      </div>
    </div>
  );
}

function GroupOverlay(props){
  return(
    <div>
      <div>{props.name}</div>
      <div class="column">
        <For each={props.items}>
          {(item) => <ItemOverlay name={item.name}/>}
        </For>
      </div>
    </div>
  );
}

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

  const [entities, setEntities] = createStore({});

  let nextOrder = 0;

  function getNextOrder(){
    nextOrder += ORDER_DELTA;
    return nextOrder.toString();
  }

  function addGroup(id, name, color){
    setEntities(id, {
      id,
      name,
      color: color,
      type: "group",
      order: getNextOrder(),
    });
  }

  function addItem(id, name, group, color){
    setEntities(id, {
      id,
      name,
      group,
      color: color,
      type: "item",
      order: getNextOrder(),
    });
  }

  function setup(){
    batch(() => {
      addGroup(1, "Todo");
      addGroup(2, "In Progress");
      addGroup(3, "Done");
      addItem(4, "Make waves", 1);
      addItem(5, "Party!.", 1);
      addItem(6, "Meet friends.", 2);
      addItem(7, "Do shopping.", 3);
    });
  }
  onMount(setup);

  const groups = () =>
    sortByOrder(
      Object.values(entities).filter((item) => item.type == "group")
    );

  const groupIds = () => groups().map((group) => group.id);

  const groupOrders = () => groups().map((group) => group.order);

  const groupItems = (groupId) =>
    sortByOrder(
      Object.values(entities).filter(
        (entity) => entity.type == "item" && entity.group == groupId
      )
    )

  const groupItemIds = (groupId) => 
    groupItems(groupId).map((item) => item.id);

  const groupItemOrders = (groupId) =>
    groupItems(groupId).map((item) => item.order);

  const isSortableGroup = (sortable) =>
    sortable.data.type == "group";

  function closestEntity(draggable, droppables, context){
    const closestGroup = closestCenter(
      draggable,
      droppables.filter((droppable) => isSortableGroup(droppable)),
      context
    );
    if (isSortableGroup(draggable)){
      return closestGroup;
    } else if (closestGroup){
      const closestItem = closestCenter(
        draggable,
        droppables.filter(
          (droppable) =>
            !isSortableGroup(droppable) &&
          droppable.data.group == closestGroup.id
        ),
        context
      );

      if (!closestItem){
        return closestGroup;
      }

      const changingGroup = draggable.data.group != closestGroup.id;

      if(changingGroup){
        const belowLastItem =
          groupItemIds(closestGroup.id).at(-1) == closestItem.id &&
          draggable.transformed.center.y > closestItem.transformed.center.y;

        if(belowLastItem) return closestGroup;
      }

      return closestItem;
    }
  }

  function move(draggable, droppable, onlyWhenChangingGroup = true){
    if (!draggable || !droppable) return;

    const draggableIsGroup = isSortableGroup(draggable);
    const droppableIsGroup = isSortableGroup(droppable);

    const draggableGroupId = draggableIsGroup
      ? draggable.id
      : draggable.data.group;
    
    const droppableGroupId = droppableIsGroup
      ? droppable.id
      : droppable.data.group;
    
    if (
      onlyWhenChangingGroup &&
      (draggableIsGroup || draggableGroupId == droppableGroupId)
    ) {
      return;
    }

    let ids, orders, order;

    if (draggableIsGroup){
      ids = groupIds();
      orders = groupOrders();
    } else {
      ids = groupItemIds(droppableGroupId);
      orders = groupItemOrders(droppableGroupId)
    }

    if (droppableIsGroup && !draggableIsGroup) {
      order = new Big(orders.at(-1) ?? -ORDER_DELTA).plus(ORDER_DELTA).round();
    } else {
      const draggableIndex = ids.indexOf(draggable.id);
      const droppableIndex = ids.indexOf(droppable.id);
      if (draggableIndex != droppableIndex){
        let orderAfter, orderBefore;
        if (draggableIndex == -1 || draggableIndex > droppableIndex){
          orderBefore = new Big(orders[droppableIndex]);
          orderAfter = new Big(
            orders[droppableIndex - 1] ?? orderBefore.minus(ORDER_DELTA * 2)
          );
        } else {
          orderAfter = new Big(orders[droppableIndex]);
          orderBefore = new Big(
            orders[droppableIndex + 1] ?? orderAfter.plus(ORDER_DELTA * 2)
          );
        }

        if (orderAfter != undefined && orderBefore != undefined){
          order = orderAfter.plus(orderBefore).div(2.0);
          const rounded = order.round();
          if (rounded.gt(orderAfter) && rounded.lt(orderBefore)){
            order = rounded;
          }
        }
      }
    }

    if (order != undefined){
      setEntities(draggable.id, (entity) => ({
        ...entity,
        order: order.toString(),
        group: droppableGroupId,
      }));
    }
  };

  function onDragOver({draggable, droppable}){
    move(draggable, droppable);
  }

  function onDragEnd({draggable, droppable}){
    move(draggable, droppable, false);
  }

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
        <div>
          <DragDropProvider
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            collisionDetector={closestEntity}
          >
            <DragDropSensors/>
            <div class="columns">
              <SortableProvider ids={groupIds()}>
                <For each={groups()}>
                  {(group) => (
                    <Group
                      id={group.id}
                      name={group.name}
                      items={groupItems(group.id)}
                    />
                  )}
                </For>
              </SortableProvider>
            </div>
            <DragOverlay>
              {(draggable) => {
                const entity = entities[draggable.id];
                return isSortableGroup(draggable) ? (
                  <GroupOverlay name={entity.name} items={groupItems(entity.id)}/>
                ) : (
                  <ItemOverlay name={entity.name}/>
                );
              }}
            </DragOverlay>
          </DragDropProvider>
        </div>
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
