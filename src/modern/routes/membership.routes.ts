import express, { Request, Response } from "express";
import {
  GetResponseBody,
  PostRequestBody,
  PostResponseBody
} from "../types/membership.types";
import { EmptyObject } from "../types/helpers.types";
import { getAllMembershipsWithPeriods } from "../model/get-all-memberships-with-periods";
import { validateMembershipPostRequest } from "../model/validate-membership-post-request";
import { addMembership } from "../database/memberships";
import { createNewMembership } from "../model/create-new-membership";
import { createNewMembershipPeriods } from "../model/create-new-membership-periods";
import { addMembershipPeriods } from "../database/membership-periods";

const router = express.Router();

router.get("/", (req: Request<EmptyObject, GetResponseBody, EmptyObject>, res: Response<GetResponseBody>) => {
  const rows = getAllMembershipsWithPeriods();
  res.status(200).json(rows);
});

router.post("/", (req: Request<EmptyObject, PostResponseBody, PostRequestBody>, res: Response) => {
  const userId = 2000;

  const errorMessage = validateMembershipPostRequest(req.body);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const newMembership = createNewMembership(req.body, userId);
  addMembership(newMembership);

  const membershipPeriods = createNewMembershipPeriods(newMembership);
  addMembershipPeriods(membershipPeriods);

  res.status(201).json({ membership: newMembership, membershipPeriods });
});

export default router;
