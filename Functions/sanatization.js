const {writeError} = require("./errorNote")

const onlyNumbers = async (string) => {
    const regex = /^\d+$/
    return regex.test(string)
}

const addressCheckup = async (addressArray) => {
    try {
        // Check for special characters,
        // If return is false (No special characters inside the string)
        // If return is true (special characters that might do harm is inside of the string)
        const regex = /["`;\#<>&+%\(\)=\\]/

        const textSanitization = addressArray.map((inputText) => {
            return regex.test(inputText)
        })

        // Does the array include a "true"?
        const checkSanitation = textSanitization.includes(true)


        if (checkSanitation === true) {
            return {
                status: "Failed",
                msg: "Kun følgende special tegn er tilladt: Bindestreg (-), \nSkråstreg (/), \nPunktum (.), \nKomma (,) \nApostrof (')",
                data: textSanitization
            }
        }
        if (checkSanitation === false) {
            return {
                status: "Success"
            }
        }
    } 
    catch (error) {
        writeError({
            status: "Failed",
            msg: "Could not sanatize the array ( sanatization.js > addressCheckup )",
            data: addressArray
        })
        return {
            status: "Failed",
            msg: "Fejl på serveren, prøv igen"
        }
    }
    
}






module.exports = {
    onlyNumbers,
    addressCheckup
}