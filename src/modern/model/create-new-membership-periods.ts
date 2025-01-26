import { Membership, MembershipPeriod } from "../types/membership.types";
import { toDateFromISOString, toISOStringFromDate } from "../utils/date-utils";
import { v4 as uuidv4 } from "uuid";
import { addBillingIntervals, getValidUntilDate } from "./get-valid-until-date";

export const createNewMembershipPeriods = (membership: Membership) => {
  let membershipPeriods: Array<MembershipPeriod> = [];

  const membershipValidFrom = toDateFromISOString(membership.validFrom);
  const billingInterval = membership.billingInterval;

  for (let i = 0; i < membership.billingPeriods; i++) {
    const validFrom = addBillingIntervals({
      validFrom: membershipValidFrom,
      billingPeriods: i,
      billingInterval
    });

    const validUntil = getValidUntilDate({
      validFrom,
      billingPeriods: 1,
      billingInterval
    });

    const period: MembershipPeriod = {
      id: i + 1,
      uuid: uuidv4(),
      membership: membership.id,
      start: toISOStringFromDate(validFrom),
      end: toISOStringFromDate(validUntil),
      state: 'planned'
    };
    membershipPeriods.push(period);
  }

  return membershipPeriods;
};