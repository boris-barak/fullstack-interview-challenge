import { app, server } from '../../';
import request from "supertest";
import * as uuid from 'uuid';

const memberships = require('../../data/memberships.json');

/**
 * Note: Usually, I would mock the data before tests in beforeEach block
 * but since we already use mocks as JSON files, it's not needed
 **/

jest.mock('uuid');

beforeEach(() => {
  jest
    .useFakeTimers()
    .setSystemTime(new Date('2025-01-24'));

  const uuidSpy = jest.spyOn(uuid, 'v4');
  uuidSpy.mockReturnValue("fdc44ef3-d71c-42d9-8077-17abc9de8464");
});

afterEach(() => {
  jest
    .useRealTimers();
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
      const result = await request(app).post('/legacy/memberships').send();

      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual({ "message": "missingMandatoryFields" });
    });

    it('should catch negativeRecurringPrice', async () => {
      const result = await request(app).post('/legacy/memberships').send({
        name: 'some_name',
        recurringPrice: -0.01,
      });

      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual({ "message": "negativeRecurringPrice" });
    });

    // @todo Fix discrepancy between the condition and message
    it('should catch cashPriceBelow100', async () => {
      const result = await request(app).post('/legacy/memberships').send({
        name: 'some_name',
        paymentMethod: 'cash',
        recurringPrice: 100.01,
      });

      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual({ "message": "cashPriceBelow100" });
    });

    describe('monthly billing interval', () => {
      it('should catch billingPeriodsMoreThan12Months', async () => {
        const result = await request(app).post('/legacy/memberships').send({
          name: 'some_name',
          billingInterval: 'monthly',
          recurringPrice: 100,
          billingPeriods: 13
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "billingPeriodsMoreThan12Months" });
      });

      // @todo Fix a bug: req.body.billingPeriods instead of req.billingPeriods
      it.skip('should catch billingPeriodsLessThan6Months', async () => {
        const result = await request(app).post('/legacy/memberships').send({
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
        const result = await request(app).post('/legacy/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 11
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "billingPeriodsMoreThan10Years" });
      });

      // @todo Fix discrepancy between the condition and message
      it('should catch billingPeriodsLessThan3Years', async () => {
        const result = await request(app).post('/legacy/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 4
        });

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual({ "message": "billingPeriodsLessThan3Years" });
      });
    });

    describe('weekly billing interval', () => {
      // @todo Fix discrepancy between the condition and message
      it.skip('should not be caught ', async () => {
        const result = await request(app).post('/legacy/memberships').send({
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
        const result = await request(app).post('/legacy/memberships').send({
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
        const result = await request(app).post('/legacy/memberships').send({
          name: 'some_name',
          billingInterval: 'monthly',
          recurringPrice: 100,
          billingPeriods: 11,
          validFrom: '2015-01-24'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.validUntil).toEqual("2015-12-24T00:00:00.000Z");
      });

      it('should add years from validFrom', async () => {
        const result = await request(app).post('/legacy/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2015-01-24'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.validUntil).toEqual("2018-01-24T00:00:00.000Z");
      });

      // @todo Fix wrong validation, not possible to reach this now
      it.skip('should add weeks from validFrom', async () => {
        const result = await request(app).post('/legacy/memberships').send({
          name: 'some_name',
          billingInterval: 'weekly',
          recurringPrice: 100,
          billingPeriods: 10,
          validFrom: '2015-01-24'
        });

        expect(result.statusCode).toEqual(201);
        expect(result.body.membership.validUntil).toEqual("2015-12-24T00:00:00.000Z");
      });
    });

    describe('state', () => {
      it('should be active when now is in range between validFrom and validUntil', async () => {
        const result = await request(app).post('/legacy/memberships').send({
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
        const result = await request(app).post('/legacy/memberships').send({
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
        const result = await request(app).post('/legacy/memberships').send({
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
        const result = await request(app).post('/legacy/memberships').send({
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

        const result = await request(app).post('/legacy/memberships').send({
          name: 'some_name',
          billingInterval: 'yearly',
          recurringPrice: 100,
          billingPeriods: 3,
          validFrom: '2026-01-20'
        });

        // @todo finish this test after the test pointing switched to the modern version
      });
    });
  });

  describe('updated membership periods', () => {
    it('should contain all months', async () => {
      const result = await request(app).post('/legacy/memberships').send({
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
      const result = await request(app).post('/legacy/memberships').send({
        name: 'some_name',
        billingInterval: 'yearly',
        recurringPrice: 100,
        billingPeriods: 3,
        validFrom: '2015-01-24'
      });

      expect(result.statusCode).toEqual(201);
      expect(result.body.membershipPeriods).toMatchSnapshot();
    });

    // @todo Fix wrong validation, not possible to reach this now
    it.skip('should contain all weeks', async () => {
      const result = await request(app).post('/legacy/memberships').send({
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


      const result = await request(app).post('/legacy/memberships').send({
        name: 'some_name',
        billingInterval: 'yearly',
        recurringPrice: 100,
        billingPeriods: 3,
        validFrom: '2026-01-20'
      });

      // @todo finish this test after the test pointing switched to the modern version
    });
  });
});