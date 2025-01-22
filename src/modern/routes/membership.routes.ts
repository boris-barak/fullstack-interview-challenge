import express, { Request, Response } from "express"
import memberships from "../../data/memberships.json"
import membershipPeriods from "../../data/membership-periods.json"

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  const rows = memberships.map(membership => {
    // There was a bug/typo here easily spotted after moving to TS: p.membershipId === membership.id
    const periods = membershipPeriods.filter(period => period.membership === membership.id)
    return { membership, periods };
  })

  res.status(200).json(rows);
})

router.post("/", (req: Request, res: Response) => {
  throw new Error('not implemented')
})

export default router;
