import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Invoice } from "@/types";

interface InvoicesState {
  items: Invoice[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: InvoicesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchInvoices = createAsyncThunk("invoices/fetchAll", async () => {
  return await api.get<Invoice[]>("/invoices");
});

export const payInvoice = createAsyncThunk(
  "invoices/pay",
  async ({ id, method }: { id: string; method: "card" | "cash" | "mobile" }) => {
    return await api.post<{ id: string; status: string }>(`/invoices/${id}/pay`, { method });
  },
);

export const createCheckoutSession = createAsyncThunk("invoices/checkout", async (invoiceId: string) => {
  return await api.post<{ url: string }>("/payments/checkout", { invoiceId });
});

const invoicesSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load invoices";
      })
      .addCase(payInvoice.fulfilled, (state, action) => {
        const invoice = state.items.find((i) => i.id === action.payload.id);
        if (invoice) {
          invoice.status = "paid";
          invoice.payment = {
            method: action.meta.arg.method === "card" ? "card" : "cash",
            paidAt: new Date().toISOString(),
            last4: action.meta.arg.method === "card" ? "4242" : null,
          };
        }
      });
  },
});

export default invoicesSlice.reducer;
