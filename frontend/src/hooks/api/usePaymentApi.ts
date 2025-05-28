import apiService from "../../services/api";
import { ApiResponse } from "../../types";
import { CreatePaymentParams, Payment } from "../../types/payment";
import { PAYMENT_ENDPOINTS } from "../../utils/constants";
import { useApiMutation } from "../useQueryHooks";

/**
 * Custom hook to create a new order
 */
export const useCreatePaymentIntent = () => {
  return useApiMutation<Payment, CreatePaymentParams>(
    async (params: CreatePaymentParams) => {
      return apiService.post<ApiResponse<Payment>>(
        PAYMENT_ENDPOINTS.CREATE,
        params
      );
    },
    {
      onSuccess: () => {},
    }
  );
};
