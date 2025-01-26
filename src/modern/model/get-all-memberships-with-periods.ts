import { getAllMemberships } from "../database/memberships";
import { getAllMembershipPeriods } from "../database/membership-periods";

export const getAllMembershipsWithPeriods = () => getAllMemberships().map(membership => {
  // There was a bug/typo here easily spotted after moving to TS: p.membershipId === membership.id
  const periods = getAllMembershipPeriods().filter(period => period.membership === membership.id);
  return { membership, periods };
});