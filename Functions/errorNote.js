const fs = require("fs").promises

const writeError = async (object) => {
    try {
        const errorJSON = await fs.readFile("./errors.json", 'utf8')
        const errorParsed = await JSON.parse(errorJSON)
    
        const updatedJSON = [
            object,
            ...errorParsed
        ]
    
        const updatedJSONStringed = JSON.stringify(updatedJSON)
        const updateFile = fs.writeFile("./errors.json", updatedJSONStringed, 'utf8')
    } 
    catch (error) {
        console.log(error)
    }
}


module.exports = {
    writeError
}