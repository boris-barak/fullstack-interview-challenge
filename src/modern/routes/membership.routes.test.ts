import app from '../../'
import request from "supertest"

describe('GET /memberships', () => {
  it('should return the list of memberships', async () => {
    const result = await request(app).get('/memberships').send();

    expect(result.statusCode).toEqual(200);
    expect(result.body).toMatchSnapshot()
  })
});