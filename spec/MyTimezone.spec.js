const { default: MyTimezone } = require('../dist/commonjs');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000; // 10 seconds

describe('MyTimezone', () => {
  const tz = new MyTimezone();

  it('returns an address from Google', done => {
    const location = 'Berlin, Germany';
    tz
      .getLocationByName(location)
      .then(data => {
        const { formatted_address } = data;
        expect(formatted_address).toEqual(location);
        done();
      })
      .catch(err => done.fail(err));
  });

  it('returns the time for a location', done => {
    tz
      .getTimeByLocation(52.5303654, 13.3497483)
      .then(data => {
        console.log('52.5303654, 13.3497483', data.toString());
        //expect(data.isBefore(new Date())).toBe(true);
        done();
      })
      .catch(err => done.fail(err));
    tz
      .getTimeByLocation(52.5303654, 8.3497483)
      .then(data => {
        console.log('50.5303654, 13.3497483', data.toString());
        //expect(data.isBefore(new Date())).toBe(true);
        done();
      })
      .catch(err => done.fail(err));
  });

  it('returns the time for an address', done => {
    tz
      .getTimeByAddress('Berlin, Germany')
      .then(data => {
        console.log('Berlin, Germany', data.toString());
        done();
      })
      .catch(err => done.fail(err));

    tz
      .getTimeByAddress('Minsk, Belarus')
      .then(data => {
        console.log('Minsk, Belarus', data.toString());
        done();
      })
      .catch(err => done.fail(err));
  });

  it('calculates the distance between two locations', () => {
    const result = tz.calculateDistance(13.3497483, 52.5303654);
    const result2 = tz.calculateDistance(52.5303654, 13.3497483);
    expect(result).toEqual(39.1806171);
    expect(result2).toEqual(39.1806171);
  });
});