import { addMonths, addWeeks, addYears } from "date-fns";
import { BillingInterval } from "../types/membership.types";

type GetValidUntilDateProps = {
  validFrom: Date,
  billingInterval: BillingInterval,
  billingPeriods: number
}

export const getValidUntilDate = ({ validFrom, billingInterval, billingPeriods }: GetValidUntilDateProps): Date => {
  switch (billingInterval) {
    case 'weekly':
      return addWeeks(validFrom, billingPeriods);
    case 'monthly':
      return addMonths(validFrom, billingPeriods);
    case 'yearly':
      return addYears(validFrom, billingPeriods);
    default:
      return validFrom;
  }
};