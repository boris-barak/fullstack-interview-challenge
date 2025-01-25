import { PostRequestBody } from "../types/membership.types";

type ErrorMessage = string
type SuccessState = null

export const validateMembershipPostRequest = ({
  billingInterval,
  billingPeriods,
  name,
  paymentMethod,
  recurringPrice
}: Partial<PostRequestBody>): ErrorMessage | SuccessState => {
  if (!name || !recurringPrice) {
    return "missingMandatoryFields";
  }

  if (recurringPrice < 0) {
    return "negativeRecurringPrice";
  }

  if (recurringPrice < 100 && paymentMethod === 'cash') {
    return "cashPriceBelow100";
  }

  if (!billingPeriods) {
    return "invalidBillingPeriods";
  }

  switch (billingInterval) {
    case 'monthly':
      if (billingPeriods > 12) {
        return "billingPeriodsMoreThan12Months";
      }

      if (billingPeriods < 6) {
        return "billingPeriodsLessThan6Months";
      }

      break;
    case 'yearly':
      if (billingPeriods > 10) {
        return "billingPeriodsMoreThan10Years";
      }

      if (billingPeriods < 3) {
        return "billingPeriodsLessThan3Years";
      }

      break;
    case 'weekly':
      break;
    default:
      // I believe it would be good to log it in case we would forget to add a new one
      console.error(`Unknown billingInterval: ${billingInterval}`);
      return "invalidBillingPeriods"; // I believe "invalidBillingInterval" would be better name here
  }

  return null;
};