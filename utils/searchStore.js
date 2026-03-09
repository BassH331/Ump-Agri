let searchText = '';
let subscribers = [];

export const setSearchText = (value) => {
  searchText = value;
  subscribers.forEach((cb) => cb(searchText));
};

export const getSearchText = () => searchText;

export const subscribeToSearch = (callback) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
};