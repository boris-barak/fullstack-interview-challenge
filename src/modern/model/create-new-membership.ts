import { Membership, MembershipState, PostRequestBody } from "../types/membership.types";
import { getNow, toDateFromISOString, toISOStringFromDate } from "../utils/date-utils";
import { getAllMemberships } from "../database/memberships";
import { v4 as uuidv4 } from "uuid";
import { getValidUntilDate } from "./get-valid-until-date";

export const createNewMembership = (requestData: PostRequestBody, userId: number): Membership => {
  const validFrom = getValidFromDate(requestData.validFrom);
  const validUntil = getValidUntilDate({ ...requestData, validFrom });
  const state = getState({ validFrom, validUntil });

  const memberships = getAllMemberships();

  return {
    id: memberships.length + 1,
    uuid: uuidv4(),
    name: requestData.name,
    state,
    validFrom: toISOStringFromDate(validFrom),
    validUntil: toISOStringFromDate(validUntil),
    userId,
    paymentMethod: requestData.paymentMethod ?? null,
    recurringPrice: requestData.recurringPrice,
    billingPeriods: requestData.billingPeriods,
    billingInterval: requestData.billingInterval,
  };
};

const getValidFromDate = (validFrom: string | null | undefined): Date => validFrom ? toDateFromISOString(validFrom) : getNow();

type GetStateProps = {
  validFrom: Date,
  validUntil: Date,
}

const getState = ({ validFrom, validUntil }: GetStateProps): MembershipState => {
  if (validFrom > getNow()) {
    return 'pending';
  }

  if (validUntil < getNow()) {
    return 'expired';
  }

  return 'active';
};