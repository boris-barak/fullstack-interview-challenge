import { addMonths, addWeeks, addYears, subDays } from "date-fns";
import { BillingInterval } from "../types/membership.types";

type GetValidUntilDateProps = {
  validFrom: Date,
  billingInterval: BillingInterval,
  billingPeriods: number
}

export const getValidUntilDate = (props: GetValidUntilDateProps): Date => {
  const validUntil = addBillingIntervals(props);

  // to correct the interval, we need to subtract one day from the end
  return subDays(validUntil, 1);
};

export const addBillingIntervals = ({ validFrom, billingInterval, billingPeriods }: GetValidUntilDateProps): Date => {
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