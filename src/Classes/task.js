class Task{
    #id;
    #type;
    #title;
    #start;
    #end;
    #description;
    #importance;

    constructor(id, type, title, start, end, description, importance){
        this.id = id;
        this.type = type;
        this.#title = title;
        this.#start = new Date(start);
        this.#end = new Date(end);
        this.#description = description;
        this.#importance = importance;
    }

    get Id(){
        return this.#id;
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