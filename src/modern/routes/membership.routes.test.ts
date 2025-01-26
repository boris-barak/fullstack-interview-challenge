import { app, server } from '../../';
import request from "supertest";
import * as uuid from 'uuid';
import * as dbMemberships from '../database/memberships';
import * as dbMembershipPeriods from '../database/membership-periods';
import membershipsRaw from "../../data/memberships.json";
import membershipPeriodsRaw from "../../data/membership-periods.json";

jest.mock('uuid');
jest.mock('../database/memberships');
jest.mock('../database/membership-periods');

let spy: jest.SpyInstance;

beforeEach(() => {
  const getAllMembershipsSpy = jest.spyOn(dbMemberships, 'getAllMemberships');
  getAllMembershipsSpy.mockImplementation(() => membershipsRaw);

  const getAllMembershipPeriodsSpy = jest.spyOn(dbMembershipPeriods, 'getAllMembershipPeriods');
  getAllMembershipPeriodsSpy.mockImplementation(() => membershipPeriodsRaw);

  jest
    .useFakeTimers()
    .setSystemTime(new Date('2025-01-24'));

  const uuidSpy = jest.spyOn(uuid, 'v4');
  uuidSpy.mockReturnValue("fdc44ef3-d71c-42d9-8077-17abc9de8464");

  spy = jest.spyOn(console, 'error').mockImplementation(() => null);
});

afterEach(() => {
  jest
    .useRealTimers();

  spy.mockRestore();
});

afterAll(() => {
  // to get rid of "Jest did not exit one second after the test run has completed." warning
  server.close();
});

describe('GET /memberships', () => {
  it('should return the list of memberships', async () => {
    const result = await request(app).get('/memberships').send();

    expect(result.statusCode).toEqual(200);
    expect(result.body).toMatchSnapshot();
  });
});

describe('POST /memberships', () => {
  describe('validation', () => {
    it('should catch missingMandatoryFields', async () => {
      const result = await request(app).post('/memberships').send();

      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual({ "message": "missingMandatoryFields" });
    });

    it('should catch negativeRecurringPrice', async () => {
      const result = await request(app).post('/memberships').send({
        name: 'some_name',
        recurringPrice: -0.01,
      });

      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual({ "message": "negativeRecurringPrice" });
    });

    it('should catch cashPriceBelow100', async () => {
      const result = await request(app).post('/memberships').send({
        name: 'some_name',
        paymentMethod: 'cash',
        recurringPrice: 99.99,
      });

      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual({ "message": "cashPriceBelow100" });
    });

    describe('monthly billing interval', () => {
      it('should catch billingPeriodsMoreThan12Months', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'monthly',
          recurringPrice: 100,
          billingPeriods: 13
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "billingPeriodsMoreThan12Months" });
      });

      it('should catch billingPeriodsLessThan6Months', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'monthly',
          recurringPrice: 100,
          billingPeriods: 5
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "billingPeriodsLessThan6Months" });
      });
    });

    describe('yearly billing interval', () => {
      it('should catch billingPeriodsMoreThan10Years', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 11
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "billingPeriodsMoreThan10Years" });
      });

      it('should catch billingPeriodsLessThan3Years', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 2
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "billingPeriodsLessThan3Years" });
      });
    });

    describe('weekly billing interval', () => {
      it('should not be caught ', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'weekly',
          recurringPrice: 100,
          billingPeriods: 11
        });

        expect(result.statusCode).toEqual(201);
      });
    });

    describe('other billing interval', () => {
      it('should be caught ', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'something_invalid',
          recurringPrice: 100,
          billingPeriods: 11
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "invalidBillingPeriods" });
      });
    });
  })

  describe('new membership', () => {
    describe('validUntil', () => {
      it('should add months from validFrom', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'monthly',
          recurringPrice: 100,
          billingPeriods: 11,
          validFrom: '2015-04-01'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.validUntil).toEqual("2016-02-29");
      });

      it('should add years from validFrom', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2015-01-24'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.validUntil).toEqual("2018-01-23");
      });

      it('should add weeks from validFrom', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'weekly',
          recurringPrice: 100,
          billingPeriods: 10,
          validFrom: '2025-01-24'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.validUntil).toEqual("2025-04-03");
      });
    });

    describe('state', () => {
      it('should be active when now is in range between validFrom and validUntil', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2025-01-20'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.state).toEqual("active");
      });

      it('should be pending when now is before validFrom', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2026-01-20'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.state).toEqual("pending");
      });

      it('should be expired when now is after validUntil', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2020-01-20'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.state).toEqual("expired");
      });
    });

    describe('all properties', () => {
      it('should be in response when all required properties are set', async () => {
        const result = await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2026-01-20'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership).toMatchSnapshot();
      });

      it('should be saved to the database', async () => {
        const addMembershipSpy = jest.spyOn(dbMemberships, 'addMembership');
        addMembershipSpy.mockImplementation(jest.fn());

        await request(app).post('/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2026-01-20'
        });

        expect(addMembershipSpy).toHaveBeenLastCalledWith({
          "billingInterval": "yearly",
          "billingPeriods": 3,
          "id": 4,
          "name": "some_name",
          "paymentMethod": null,
          "recurringPrice": 100,
          "state": "pending",
          "userId": 2000,
          "uuid": "fdc44ef3-d71c-42d9-8077-17abc9de8464",
          "validFrom": "2026-01-20",
          "validUntil": "2029-01-19"
        });
      });
    });
  });

  describe('updated membership periods', () => {
    it('should contain all months', async () => {
      const result = await request(app).post('/memberships').send({
        name: 'some_name',
        billingInterval: 'monthly',
        recurringPrice: 100,
        billingPeriods: 11,
        validFrom: '2015-01-24'
      });

      expect(result.statusCode).toEqual(201);
      expect(result.body.membershipPeriods).toMatchSnapshot();
    });

    it('should contain all years', async () => {
      const result = await request(app).post('/memberships').send({
        name: 'some_name',
        billingInterval: 'yearly',
        recurringPrice: 100,
        billingPeriods: 3,
        validFrom: '2015-01-24'
      });

      expect(result.statusCode).toEqual(201);
      expect(result.body.membershipPeriods).toMatchSnapshot();
    });

    it('should contain all weeks', async () => {
      const result = await request(app).post('/memberships').send({
        name: 'some_name',
        billingInterval: 'weekly',
        recurringPrice: 100,
        billingPeriods: 10,
        validFrom: '2015-01-24'
      });

      expect(result.statusCode).toEqual(201);
      expect(result.body.membershipPeriods).toMatchSnapshot();
    });

    it('should be saved to the database', async () => {
      const addMembershipPeriodSpy = jest.spyOn(dbMembershipPeriods, 'addMembershipPeriods');
      addMembershipPeriodSpy.mockImplementation(jest.fn());

      await request(app).post('/memberships').send({
        name: 'some_name',
        billingInterval: 'yearly',
        recurringPrice: 100,
        billingPeriods: 3,
        validFrom: '2026-01-20'
      });

      expect(addMembershipPeriodSpy).toHaveBeenLastCalledWith([{
        "end": "2027-01-19",
        "id": 1,
        "membership": 4,
        "start": "2026-01-20",
        "state": "planned",
        "uuid": "fdc44ef3-d71c-42d9-8077-17abc9de8464"
      }, {
        "end": "2028-01-19",
        "id": 2,
        "membership": 4,
        "start": "2027-01-20",
        "state": "planned",
        "uuid": "fdc44ef3-d71c-42d9-8077-17abc9de8464"
      }, {
        "end": "2029-01-19",
        "id": 3,
        "membership": 4,
        "start": "2028-01-20",
        "state": "planned",
        "uuid": "fdc44ef3-d71c-42d9-8077-17abc9de8464"
      }]);
    });
  });
});