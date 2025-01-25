import { Membership, MembershipPeriod } from "../types/membership.types";
import { toDateFromISOString, toISOStringFromDate } from "../utils/date-utils";
import { v4 as uuidv4 } from "uuid";
import { getValidUntilDate } from "./get-valid-until-date";

export const createNewMembershipPeriods = (membership: Membership) => {
  let membershipPeriods: Array<MembershipPeriod> = [];

  let periodStart = toDateFromISOString(membership.validFrom);

  for (let i = 0; i < membership.billingPeriods; i++) {
    const validFrom = periodStart;
    const validUntil = getValidUntilDate({
      validFrom,
      billingPeriods: 1,
      billingInterval: membership.billingInterval
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

    periodStart = validUntil;
  }

  return membershipPeriods;
};