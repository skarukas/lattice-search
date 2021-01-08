function successors(state) {
    let arr = state.split(" ").map(Number)
    let up = arr.map((_, i) => {
        let a = [...arr]
        a[i] += 1
        return a.join(" ")
    })
    let down = arr.map((_, i) => {
        let a = [...arr]
        a[i] -= 1
        return a.join(" ")
    })
    return [...up, ...down]
}

function mod(a, b) {
    return ((a%b) + b) % b
}


function is_goal(state, goal, intervals, err) {
    state = state.split(" ").map(Number)
    let interval = 0
    for (let i = 0; i < intervals.length; i++) {
        interval += intervals[i].multiply(state[i]).cents() / 100
    }
    let octaves = -Math.floor(interval / 12)
    interval = mod(interval, 12)
    let bool = Math.abs(interval - goal) < err
    return [octaves, bool]
}


export default function search(goal, intervals, err=1e-2) {
    let start = Date.now()
    if (goal >= 12) return []

    // state = string of space-separated powers, e.g. "3 0 1"
    let init_state = intervals.map(ø=>0).join(" ")
    let fringe = new Queue()
    fringe.enqueue(init_state)
    let fringeset = new Set(init_state)
    let visited = new Set()

    while (fringe.size) {
        let v = fringe.dequeue()
        fringeset.delete(v)
        visited.add(v)
        if (Date.now() - start > 500) {
            let errorMessage = `
Computation timeout after 0.5s: there may be an infinite loop. 

It's possible that the intervals provided are equal divisions of an octave and therefore do not map to the complete space from 0¢ - 1199¢.

In general, computation will be slow or unsuccessful when only a few basis intervals are provided.`
            alert(errorMessage)
            throw new Error(errorMessage)
        }
        for (let u of successors(v)) {
            let [octaves, isGoalBool] = is_goal(u, goal, intervals, err)
            if (isGoalBool) {
                return [u.split(" ").map(Number), octaves]
            }

            if (!visited.has(u) && !fringeset.has(u)) {
                fringe.enqueue(u)
                fringeset.add(u)
            }
        }
    }

    return null
}