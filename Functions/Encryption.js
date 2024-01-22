// Import library
const crypto = require('crypto')
const fs = require("fs")
const { v4: uuidv4 } = require('uuid');





// ENCRYPT
// Takes an object
const encrypt = (userCredentials) => {
    return new Promise((resolve, reject) => {
        try {
            const currentDate = new Date()
            currentDate.setTime(currentDate.getTime() + (1000 * 60 * 60 * 18))
            const stringedUserCredentials = JSON.stringify(userCredentials)
    
            const key = crypto.randomBytes(32)
            const iv = crypto.randomBytes(12)

            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
            let encrypted = cipher.update(stringedUserCredentials, 'utf8', 'base64')

            encrypted += cipher.final('base64')
            const authTag = cipher.getAuthTag()

            const encryptionObject = {
                userEmail: userCredentials.email,
                user: userCredentials.user,
                myKey: key.toString("base64"),
                myIv: iv.toString("base64"),
                myAuthTag: authTag.toString("base64"),
                myEncryption: encrypted,
                expiresAt: currentDate
            }

            resolve(encryptionObject)
        } 
        catch (error) {
            console.log(error)
            reject("Kunne ikke kryptere, prøv igen")
        }
    })
}




// DECRYPT
// Takes a string
const decrypt = (encryptionObject) => {
    return new Promise((resolve, reject) => {
        try {
            const parsedEncryptionObject = JSON.parse(encryptionObject)

            const myKeyInBytes = Buffer.from(parsedEncryptionObject.myKey, "base64")
            const myIvInBytes = Buffer.from(parsedEncryptionObject.myIv, "base64")
            const myAuthTagInBytes = Buffer.from(parsedEncryptionObject.myAuthTag, "base64")
            const myEncryption = parsedEncryptionObject.encrypted
        
            const decipher = crypto.createDecipheriv('aes-256-gcm', myKeyInBytes, myIvInBytes)
            decipher.setAuthTag(myAuthTagInBytes)
        
            let decrypted = decipher.update(myEncryption, 'base64', 'utf8')
            decrypted += decipher.final('utf8')
            
            resolve(decrypted)
        }
        catch (error) {
            reject(`Decryption failed: ${error}`)   
        }
    })
}



const checkAdminCredentials = (userEmail, userPassword) => {
    return new Promise((resolve, reject) => {
        fs.readFile("./admin.json", 'utf8', (err, data) => {
            if (err) {
                reject(`Reading admin.json failed: ${err}`)
            }
            if (data) {
                const parsedAdminData = JSON.parse(data)
                const filteredParsedAdminData = parsedAdminData.filter((user) => {
                    return user.email === userEmail && user.password === userPassword
                })
                if (filteredParsedAdminData.length > 0) {
                    resolve(filteredParsedAdminData[0])
                }
                else {
                    reject("User not found")
                }                
            }
        })
    })
}


const login = (userEmail, userPassword) => {
    return new Promise((resolve, reject) => {
        
    })
}




const encryptLogin = (userCredentials) => {
    const stringedUserCredentials = JSON.stringify(userCredentials)

    const key = crypto.randomBytes(32)
    const iv = crypto.randomBytes(12)


    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    let encrypted = cipher.update(stringedUserCredentials, 'utf8', 'base64')

    encrypted += cipher.final('base64')
    const authTag = cipher.getAuthTag()

    const myKey = key.toString("base64")
    const myIv = iv.toString("base64")
    const myAuthTag = authTag.toString("base64")
    const myEncryption = encrypted
    const mySessionId = uuidv4()

    return new Promise((resolve, reject) => {
        fs.readFile("./sessions.json", "utf8", (err, data) => {
            if (err) {
                console.log("Could not open sessions.json")
            }
            if (data) {
                const parsedData = JSON.parse(data)
                const filteredData = parsedData.filter((session) => {
                    return session.email !== userCredentials.email
                })
                const updatedList = [
                    ...filteredData,
                    {   email: userCredentials.email,
                        key: myKey,
                        iv: myIv,
                        authTag: myAuthTag,
                        encryption: myEncryption,
                        sessionId: mySessionId
                    }
                ]
                const stringedUpdatedList = JSON.stringify(updatedList)
                fs.writeFile("./sessions.json", stringedUpdatedList, (err) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(myEncryption)
                    }
                })
            }
        })
    })
}

const checkUser = (userEncryptedCredentials) => {
    return new Promise((resolve, reject) => {
        fs.readFile("./sessions.json", 'utf8', (err, data) => {
            if (err) {
                console.log(err)
            }
            if (data) {
                const parsedData = JSON.parse(data)
                const filteredData = parsedData.filter((user) => {
                    return 
                })
            }
        })
    })
}



module.exports = {encrypt, decrypt}



