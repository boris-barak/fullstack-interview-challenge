type ISOStringDate = string

/**
 * Note: Since there is written in the README file "The response from the endpoints should be exactly the same." and
 * there are discrepancies between the interface definitions in the README and the shape of the actual data, I decided
 * to modify the interfaces to match the existing data more precisely.
 **/

// Added these common properties they were not specified in README file.
// I also assume it's a standard to have id and uuid as a part of every "data table".
interface CommonProperties {
  id: number;
  uuid: string;
}

export interface Membership extends CommonProperties {
  name: string; // name of the membership
  userId: number; // the user that the membership is assigned to - Renamed from "user" (incorrectly specified in README)
  recurringPrice: number; // price the user has to pay for every period
  validFrom: ISOStringDate; // start of the validity
  validUntil: ISOStringDate; // end of the validity
  state: MembershipState; // indicates the state of the membership
  // I added null, since it is also in one record of the data
  paymentMethod: string | null; // which payment method will be used to pay for the periods
  billingInterval: BillingInterval; // the interval unit of the periods
  billingPeriods: number; // the number of periods the membership has
}

export interface MembershipPeriod extends CommonProperties {
  membership: number; // membership the period is attached to
  start: ISOStringDate; // indicates the start of the period
  end: ISOStringDate; // indicates the end of the period
  state: MembershipPeriodState;
}

// Explanation of the (string & {}) TS hack used bellow: https://www.danielfullstack.com/article/the-hidden-typescript-hack-you-need-to-know

export type BillingInterval = 'monthly' | 'weekly' | 'yearly' | (string & {});

export type MembershipState = 'active' | 'pending' | 'expired' | (string & {});

type MembershipPeriodState = 'planned' | 'issued' | (string & {});

export type GetResponseBody = ReadonlyArray<{
  membership: Membership,
  periods: ReadonlyArray<MembershipPeriod>,
}>

export type PostRequestBody = {
  name: string; // name of the membership
  recurringPrice: number; // price the user has to pay for every period
  billingInterval: BillingInterval; // the interval unit of the periods
  billingPeriods: number; // the number of periods the membership has
  paymentMethod: string | null; // which payment method will be used to pay for the periods
  validFrom?: ISOStringDate; // start of the validity
}

export type PostResponseBody = {
  message: string
} | {
  membership: Membership,
  membershipPeriods: ReadonlyArray<MembershipPeriod>,
}