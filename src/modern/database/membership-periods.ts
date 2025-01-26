import membershipPeriodsRaw from "../../data/membership-periods.json";
import { MembershipPeriod } from "../types/membership.types";

// mapping the types to our precisely defined type definition
let membershipPeriods: Array<MembershipPeriod> = membershipPeriodsRaw;

export const getAllMembershipPeriods = () => membershipPeriods;

export const addMembershipPeriods = (newPeriods: ReadonlyArray<MembershipPeriod>) => {
  membershipPeriods.push(...newPeriods);
};