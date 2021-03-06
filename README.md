# Neighborhood-Map
Front-End Web Developer Nanodegree Course Project

## How to build
The project can be build with [gulp.js](http://gulpjs.com)

### Requirements
1. node: 7.0.0

1. (Optional) A valid Google key with the following API enabled:
  * Google Places API Web Service
  * Google Maps JavaScript API

### Steps
1. (Optional) Replace my Google Maps API key with yours

  Replace my key `AIzaSyBqTI2hnBg2NNWBDfS3VsKYTYbIeWj0SqI` in `./index.html` with yours, otherwise, you will not be able to run the app on your site.

1. Install gulp command line utility

  `$ npm install -g gulp-cli`

1. Install dependencies in project directory

  `$ npm install`

1. Build project with gulp

  `$ gulp`

The output will be moved to `./dist`, and the app can be started by opening `./dist/index.html`.

## How to run it on localhost

### Requirement

python: stable 2.7.12

### Steps

1. Go to `./dist` directory

  `$ cd ./dist`

1. Run the HTTP Server

  `$ python -m SimpleHTTPServer`

The app will now be live at http://localhost:8000

## Credits
The project depends on or contains codes from the following libraries or projects:

* [MediaWiki](https://www.mediawiki.org/)
* [Bootstrap](https://getbootstrap.com)
* [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/)
* [jQuery](https://jquery.com)
* [Knockout](http://knockoutjs.com/)

## License
Copyright 2016 Tse Kit Yam, released under [Apache License, Version 2.0](https://opensource.org/licenses/Apache-2.0).
