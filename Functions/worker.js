const { parentPort } = require('worker_threads');

parentPort.on('message', (task) => {
    let result = task.data;
    parentPort.postMessage({ taskId: task.taskId, result })
})
