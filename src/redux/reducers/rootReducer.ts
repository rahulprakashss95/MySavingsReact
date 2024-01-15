// reducers.js
import { combineReducers } from "redux";
import clientReducer from "./clientReducer";

const rootReducer = combineReducers({
  clients: clientReducer,
  // Add other reducers here
});

export default rootReducer;
