class Task{
    constructor(start, end, title, description, importance){
        this.start = start;
        this.end = end;
        this.title = title;
        this.description = description;
        this.importance = importance;
    }

    getStart(){
        return this.start;
    }

    getEnd(){
        return this.end;
    }

    getTitle(){
        return this.title;
    }

    getDescription(){
        return this.description;
    }

    getImportance(){
        return this.importance;
    }
}

export default Task;