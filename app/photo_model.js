import querystring from 'querystring';
import fetch from 'node-fetch';

async function getFlickrPhotos(tags, tagmode) {
  const qs = querystring.stringify({ tags, tagmode, format: 'json' });

  const response = await fetch(`https://api.flickr.com//services/feeds/photos_public.gne?nojsoncallback=1&${qs}`);
  const data = await response.json();

  return Promise.resolve(data).then(photoFeed => {
    photoFeed.items.forEach(photo => {
      photo.media.t = photo.media.m.split('m.jpg')[0] + 't.jpg';
      photo.media.b = photo.media.m.split('m.jpg')[0] + 'b.jpg';
    });

    return photoFeed.items;
  });
}

export {
  getFlickrPhotos
};
