import * as formValidator from './form_validator.js';
import * as photoModel from './photo_model.js';

import * as googleSub from './pubsub.js';

function route(app) {
  app.get('/', (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    // get photos from flickr public feed api
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        return res.status(500).send({ error });
      });
  });

  app.post('/zip', async (req, res) => {
    const urlsTags = req.query.tags;

    //call quickstart function
    await googleSub.quickstart(urlsTags, "dmii-2024", process.env.TOPIC_SUBSCRIPTION, process.env.TOPIC_SUBSCRIPTION);

    return res.status(200).send({ message: 'Processing your request' });
  });
}

export { route };

