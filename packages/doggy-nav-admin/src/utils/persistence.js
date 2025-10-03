import { PERSISTENCE_TYPE } from "@/constants";


export function setPersistenceData(key, inputValue, type = PERSISTENCE_TYPE) {
  let value = inputValue;
  if (typeof value !== 'string') value = JSON.stringify(value);
  if (type === 'session') {
    sessionStorage.setItem(key, value);
  } else if (type === 'local') {
    localStorage.setItem(key, value);
  }
}


export function getPersistenceData(key, type = PERSISTENCE_TYPE) {
  if (type === 'session') {
    return sessionStorage.getItem(key);
  } else if (type === 'local') {
    return localStorage.getItem(key);
  }
}


export function clearPersistenceData(type = PERSISTENCE_TYPE) {
  if (type === 'session') {
    return sessionStorage.clear();
  } else if (type === 'local') {
    return localStorage.clear();
  }
}
