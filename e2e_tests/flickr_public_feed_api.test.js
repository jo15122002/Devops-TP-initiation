import * as querystring from 'querystring';
import fetch from 'node-fetch';

class API {
  constructor({ tags = '', tagmode = '', format = 'json' }) {
    const qs = querystring.stringify({ tags, tagmode, format });
    this.hostname = 'api.flickr.com';
    this.path = `/services/feeds/photos_public.gne?nojsoncallback=1&${qs}`;
  }

  gen () {
    return 'https://' + this.hostname + this.path
  }
}

describe('flickr public feed api', () => {
  test('should return expected json format', () => {
    const apiTest = new API({
      tags: 'california',
      tagmode: 'all'
    });

    return fetch(apiTest.gen()).then(async response => {
      expect(response.status).toBe(200);

      const photoFeed = JSON.parse(await response.text());
      expect(photoFeed).toHaveProperty('items');

      const photos = photoFeed.items;
      expect(photos).toBeInstanceOf(Array);

      photos.forEach(function(photo) {
        expect(Object.keys(photo)).toEqual(
          expect.arrayContaining([
            'title',
            'link',
            'media',
            'date_taken',
            'description',
            'published',
            'author',
            'author_id',
            'tags'
          ])
        );
      });
    });
  });

  test('should return many photos', () => {
    const apiTest = new API({
      tags: 'california, beach, blue',
      tagmode: 'any'
    });

    return fetch(apiTest.gen()).then(async response => {
      expect(response.status).toBe(200);

      const photoFeed = JSON.parse(await response.text());
      expect(photoFeed).toHaveProperty('items');

      const photos = photoFeed.items;
      expect(photos.length).toBeGreaterThan(0);
    });
  });

  test('should return zero photos', () => {
    // these tags should return zero results
    const apiTest = new API({
      tags: 'bad,parameters,abc,111,999',
      tagmode: 'all'
    });

    return fetch(apiTest.gen()).then(async response => {
      expect(response.status).toBe(200);

      const photoFeed = JSON.parse(await response.text());
      expect(photoFeed).toHaveProperty('items');

      const photos = photoFeed.items;
      expect(photos.length).toBe(0);
    });
  });
});
