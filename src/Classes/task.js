class Task{
    #id;
    #type;
    #title;
    #start;
    #end;
    #description;
    #importance;
    #notified = false;

    constructor(id, type, title, start, end, description, importance){
        this.#id = id;
        this.#type = type;
        this.#title = title;
        this.#start = new Date(start);
        this.#end = new Date(end);
        this.#description = description;
        this.#importance = importance;
    }

    get id(){
        return this.#id;
    }

    get type(){
        return this.#type;
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

    get notified(){
        return this.#notified;
    }

    set notified(value){
        this.#notified = value;
    }

    get printedStart(){
        let year = this.#start.getFullYear();
        let month = this.#start.toLocaleString("en-GB", {month: "long"});
        let day = this.#start.getDate();
        let hour = this.#start.getHours();
        let minutes = this.#start.getMinutes();
        let suffix = "AM";

        if (minutes < 10){
            minutes = "0" + minutes;
        }


        if (hour == 0 || hour == 12){
            hour = hour + 12;
        }

        if (hour > 12){
            hour = hour - 12;
            suffix = "PM";
        }

        return month + " " + day + ", " + year + " @ " + hour + ":" + minutes + suffix;
    }

    get printedEnd(){
        let year = this.#end.getFullYear();
        let month = this.#end.toLocaleString("en-GB", {month: "long"});
        let day = this.#end.getDate();
        let hour = this.#end.getHours();
        let minutes = this.#end.getMinutes();
        let suffix = "AM";

        if (minutes < 10){
            minutes = "0" + minutes;
        }

        if (hour == 0 || hour == 12){
            hour = hour + 12;
        }

        if (hour > 12){
            hour = hour - 12;
            suffix = "PM";
        }
        
        return month + " " + day + ", " + year + " @ " + hour + ":" + minutes + suffix;
    }

    get printedStartShort(){
        let month = this.#start.toLocaleString("en-GB", {month: "long"});
        let day = this.#start.getDate();

        return month + " " + day;
    }

    get printedEndShort(){
        let month = this.#end.toLocaleString("en-GB", {month: "long"});
        let day = this.#end.getDate();

        return month + " " + day;
    }

    get startInEpoch(){
        return this.#start.getTime();
    }
}

export default Task;