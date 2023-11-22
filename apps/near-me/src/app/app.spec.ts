import {
  getNearestMeetingLocation,
  Location,
} from './routes/closestMeetingLocation';

const taiwan: Location = [121.0211024, 23.553118];
const italy: Location = [12.5736108, 41.29246];
const portugal: Location = [-7.8536599, 39.557191];
const australia: Location = [133.281323, -26.4390917];
const america: Location = [-95.665, 37.6];

describe('Location calculation: POST /', () => {
  it('taiwan should be close to australia', () => {
    const nearest = getNearestMeetingLocation(taiwan, [
      italy,
      portugal,
      australia,
      america,
    ]);
    const nearest1 = getNearestMeetingLocation(taiwan, [
      australia,
      italy,
      portugal,
      america,
    ]);

    expect(nearest).toStrictEqual(australia);
    expect(nearest1).toStrictEqual(australia);
  });

  it('portugal should be close to italy', () => {
    const nearest = getNearestMeetingLocation(italy, [
      portugal,
      australia,
      america,
    ]);
    const nearest1 = getNearestMeetingLocation(portugal, [
      australia,
      italy,
      america,
    ]);

    expect(nearest).toStrictEqual(portugal);
    expect(nearest1).toStrictEqual(italy);
  });
});
