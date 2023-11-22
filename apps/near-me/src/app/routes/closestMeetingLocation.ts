import { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type as T, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { getDistance } from 'geolib';

const latitudeSchema = T.Number({
  minimum: -90,
  maximum: 90,
});
const longitudeSchema = T.Number({
  minimum: -180,
  maximum: 180,
});
const locationSchema = T.Tuple([longitudeSchema, latitudeSchema]);

export type Location = Static<typeof locationSchema>;

const mapLongitudeM180To180 = (location: Location): Location => [
  location[0] === -180 ? 180 : location[0],
  location[1],
];

const locationToString = (location: Location): string =>
  `${location[0]},${location[1]}`;

const parseLocationString = (locStr: string): Location =>
  Value.Decode(locationSchema, locStr.split(','));

const getLocationDistance = (loc1: Location, loc2: Location): number =>
  getDistance(
    {
      lon: loc1[0],
      lat: loc1[1],
    },
    {
      lon: loc2[0],
      lat: loc2[1],
    }
  );

export const getNearestMeetingLocation = (
  curLocation: Location,
  meetingLocations: Location[]
): Location => {
  const meetingLocationsWithDistance = meetingLocations.map((ml) => ({
    location: ml,
    distance: getLocationDistance(curLocation, ml),
  }));
  return meetingLocationsWithDistance.sort(
    (ob1, ob2) => ob1.distance - ob2.distance
  )[0]?.location;
};

const REDIS_EXPIRES = 3600;

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/',
    {
      schema: {
        description: 'Calculate the nearest location',
        body: T.Object({
          currentLocation: locationSchema,
          meetingLocations: T.Array(locationSchema, { minItems: 1 }),
        }),
        response: {
          200: T.Object({
            closestMeetingLocation: locationSchema,
          }),
        },
      },
    },
    async function (req) {
      const { currentLocation, meetingLocations } = req.body;
      const redis = req.server.redis;

      /* Prepare redis cache key */
      const cleanedCurrentLocation = mapLongitudeM180To180(currentLocation);
      const cleanedMeetingLocations = meetingLocations
        .map(mapLongitudeM180To180)
        .sort((ml1, ml2) =>
          ml1[0] === ml2[0] ? ml1[1] - ml2[1] : ml1[0] - ml2[0]
        );
      const nearestLocationRedisKey = `${locationToString(
        cleanedCurrentLocation
      )}:${cleanedMeetingLocations.length}:${cleanedMeetingLocations
        .map(locationToString)
        .join(':')}`;
      req.log.info(nearestLocationRedisKey);

      /* Use redis cache if existed, and update ttl */
      const cachedValue = await redis.get(nearestLocationRedisKey);
      if (typeof cachedValue === 'string') {
        redis.expire(nearestLocationRedisKey, REDIS_EXPIRES);
        return { closestMeetingLocation: parseLocationString(cachedValue) };
      }

      /* Calculate nearest */
      const nearestLocation = getNearestMeetingLocation(
        cleanedCurrentLocation,
        cleanedMeetingLocations
      );

      /* Set redis cache */
      await redis.set(
        nearestLocationRedisKey,
        locationToString(nearestLocation),
        'EX',
        REDIS_EXPIRES
      );

      /* Response */
      return {
        closestMeetingLocation: nearestLocation,
      };
    }
  );
}
