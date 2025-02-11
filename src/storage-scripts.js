// load local storage data
const localStorageObject = {}

// extract the list of keys
const keyList = Object.keys(localStorageObject)

// populate the local storage
keyList.map((value) => localStorage.setItem(value, localStorageObject[value]))