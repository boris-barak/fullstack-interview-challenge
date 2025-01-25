import membershipsRaw from "../../data/memberships.json";
import { Membership } from "../types/membership.types";

// mapping the types to our precisely defined type definition
let memberships: Array<Membership> = membershipsRaw;

export const getAllMemberships = () => memberships;

export const addMembership = (membership: Membership) => memberships.push(membership);