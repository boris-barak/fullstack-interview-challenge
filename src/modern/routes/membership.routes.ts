import express, { Request, Response } from "express";
import membershipsRaw from "../../data/memberships.json";
import membershipPeriodsRaw from "../../data/membership-periods.json";
import { Membership, MembershipPeriod } from "../types/membership.types";

// mapping the types to our precisely defined type definition
const memberships: ReadonlyArray<Membership> = membershipsRaw;
const membershipPeriods: ReadonlyArray<MembershipPeriod> = membershipPeriodsRaw;

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  const rows = memberships.map(membership => {
    // There was a bug/typo here easily spotted after moving to TS: p.membershipId === membership.id
    const periods = membershipPeriods.filter(period => period.membership === membership.id);
    return { membership, periods };
  });

  res.status(200).json(rows);
});

router.post("/", (req: Request, res: Response) => {
  throw new Error('not implemented');
});

export default router;
