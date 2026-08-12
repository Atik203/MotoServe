import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import servicesReducer from "./slices/servicesSlice";
import vehiclesReducer from "./slices/vehiclesSlice";
import jobsReducer from "./slices/jobsSlice";
import appointmentsReducer from "./slices/appointmentsSlice";
import chatReducer from "./slices/chatSlice";
import customersReducer from "./slices/customersSlice";
import employeesReducer from "./slices/employeesSlice";
import estimatesReducer from "./slices/estimatesSlice";
import invoicesReducer from "./slices/invoicesSlice";
import reportsReducer from "./slices/reportsSlice";
import partsReducer from "./slices/partsSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      services: servicesReducer,
      vehicles: vehiclesReducer,
      jobs: jobsReducer,
      appointments: appointmentsReducer,
      chat: chatReducer,
      customers: customersReducer,
      employees: employeesReducer,
      estimates: estimatesReducer,
      invoices: invoicesReducer,
      reports: reportsReducer,
      parts: partsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
