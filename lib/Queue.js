/* from https://initjs.org/implement-a-queue-in-javascript-de306a8821c */

// Creates the queue
var Queue = function() {
    this.storage = {};
    this.count = 0;
    this.lowestCount = 0;
}

// Adds a value to the end of the chain
Queue.prototype.enqueue = function(value) {
    // Check to see if value is defined
    if (value) {
        this.storage[this.count] = value;
        this.count++;
    }
}

// Removes a value from the beginning of the chain
Queue.prototype.dequeue = function() {
    // Check to see if queue is empty
    if (this.size === 0) {
        return undefined;
    }

    var result = this.storage[this.lowestCount];
    delete this.storage[this.lowestCount];
    this.lowestCount++;
    return result;
}

// Returns the length of the queue
Queue.prototype.size = function() {
    return this.count - this.lowestCount;
}