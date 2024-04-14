import userSlice from "./userSlice";
import { combineReducers } from "@reduxjs/toolkit";

const rootReducer = combineReducers({
  user: userSlice,
});

export { rootReducer };
