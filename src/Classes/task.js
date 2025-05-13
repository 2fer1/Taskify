class Task{
    #title;
    #start;
    #end;
    #description;
    #importance;

    constructor(title, start, end, description, importance){
        this.#title = title;
        this.#start = new Date(start);
        this.#end = new Date(end);
        this.#description = description;
        this.#importance = importance;
    }

    get start(){
        return this.#start;
    }

    get end(){
        return this.#end;
    }

    get title(){
        return this.#title;
    }

    get description(){
        return this.#description;
    }

    get importance(){
        return this.#importance;
    }
}

export default Task;