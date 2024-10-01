import {jest} from '@jest/globals'
let photoModel;

describe('getFlickrPhotos(tags, tagmode, callback)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should error when api returns 500 http status code', async () => {
    // mock the flickr public feed api endpoint and return a 500 error
    jest.doMock('node-fetch', () => {
      return jest.fn(() => {
        return Promise.reject('Response code 500 (Internal Server Error)');
      });
    });

    photoModel = await import('../photo_model.js');

    return photoModel.getFlickrPhotos('california', 'all').catch(error => {
      expect(error.toString()).toMatch(/Response code 500/);
    });
  });

  test('should error with invalid jsonp data', async () => {
    // mock the flickr public feed api endpoint with invalid jsonp data that's missing parentheses
    jest.doMock('node-fetch', () => {
      return jest.fn(() => {
        const jsonpData = `{
            "items": [
              {
                "title": "Boating",
                "media": {
                  "m": "http://farm4.staticflickr.com/3727/12608622365_9e9b8b377d_m.jpg"
                }
              }
            ]
          }`;
        return Promise.resolve({
          body: jsonpData
        });
      });
    });

    photoModel = await import('../photo_model.js');

    return photoModel.getFlickrPhotos('california', 'all').catch(error => {
      expect(error.toString()).toMatch(/Failed to convert jsonp to json/);
    });
  });
});
