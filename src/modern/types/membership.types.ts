type Date = string

/**
 * Note: Since there is written in the README file "The response from the endpoints should be exactly the same." and
 * there are discrepancies between the interface definitions in the README and the shape of the actual data, I decided
 * to modify the interfaces to match the existing data more precisely.
 **/

// Added these common properties. They were not specified in README file
// I also assume it's a standard to have id and uuid in every "data table".
interface CommonProperties {
  id: number;
  uuid: string;
}

export interface Membership extends CommonProperties {
  name: string; // name of the membership
  userId: number; // the user that the membership is assigned to - Renamed from "user" (incorrectly specified in README)
  recurringPrice: number; // price the user has to pay for every period
  validFrom: Date; // start of the validity
  validUntil: Date; // end of the validity
  state: string; // indicates the state of the membership
  // I added null, since it is also in one record of the data
  paymentMethod: string | null; // which payment method will be used to pay for the periods
  billingInterval: string; // the interval unit of the periods
  billingPeriods: number; // the number of periods the membership has
}

export interface MembershipPeriod extends CommonProperties {
  membership: number; // membership the period is attached to
  start: Date; // indicates the start of the period
  end: Date; // indicates the end of the period
  state: string;
}