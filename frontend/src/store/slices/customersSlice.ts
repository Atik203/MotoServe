import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { CreateCustomerInput, Customer } from "@/types";

interface CustomersState {
  items: Customer[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchCustomers = createAsyncThunk("customers/fetchAll", async () => {
  return await api.get<Customer[]>("/customers");
});

export const createCustomer = createAsyncThunk("customers/create", async (data: CreateCustomerInput) => {
  return await api.post<Customer>("/customers", data);
});

export const verifyCustomer = createAsyncThunk(
  "customers/verify",
  async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => {
    return await api.patch<{ id: string; status: "approved" | "rejected" | "pending" }>(
      `/customers/${id}/verify`,
      { decision },
    );
  },
);

export const fetchDocumentUrl = createAsyncThunk("customers/documentUrl", async (key: string) => {
  return await api.post<{ url: string }>("/upload/presign-get", { key });
});

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load customers";
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(verifyCustomer.fulfilled, (state, action) => {
        const customer = state.items.find((c) => c.id === action.payload.id);
        if (customer) {
          customer.status = action.payload.status;
          customer.verifiedAt = action.payload.status === "approved" ? new Date().toISOString() : null;
        }
      });
  },
});

export default customersSlice.reducer;
