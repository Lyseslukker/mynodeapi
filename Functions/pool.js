const { Worker } = require('worker_threads') 
const { v4: uuidv4 } = require('uuid')
// const createThreadPool = require('./')

function createThreadPool(size) {
    const threads = Array.from({ length: size }).map(() => ({
        worker: new Worker('./Functions/worker.js'),
        busy: false,
    })) 

    const taskQueue = [] 
  
    function execute(data) {
        return new Promise((resolve, reject) => {
            const taskId = uuidv4() 
            const task = { taskId, data, resolve, reject } 
            
            const availableThread = threads.find(t => !t.busy) 
            
            if (availableThread) {
                runTask(availableThread, task) 
            } else {
                taskQueue.push(task) 
            }
        }) 
    }

    function runTask(thread, task) {
        thread.busy = true 
        thread.worker.once('message', (message) => {
                if (message.taskId === task.taskId) {
                    thread.busy = false 
                    task.resolve(message.result) 
                if (taskQueue.length > 0) {
                    runTask(thread, taskQueue.shift()) 
                }
            }
        }) 
        thread.worker.postMessage(task)
    }
    return { execute }
}

module.exports = createThreadPool
