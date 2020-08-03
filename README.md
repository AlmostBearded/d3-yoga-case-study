# D3 Chart + Yoga Layout - Case Study

This is a case study evaluating layouting of individual elements of D3 charts with the Yoga layout engine.

Layouting is done via custom `yogaLayout` attributes which are strongly inspired by CSS Flexbox properties. Special post-layout variables have been added to the default Flexbox specification to allow for 2-dimensional layouting similar to CSS Grid. 

The 2 main files of the case study are:
- `src/yoga-layout-parser.js`: Implements a parser for DOM hierarchies that are decorated with `yogaLayout` attributes.
- `src/index.js`: Implements a bar chart that uses the `yogaLayoutParser` to layout the individual elements.

The code is quite clean and fairly well documented so it should not be to hard to get a grasp on how things are done.

# Commands

## Installing

The case study is built on the Node ecosystem so before attempting to do anything else, we need to install all the dependencies.

```
npm install
```

## Building

Gulp is used to automate repeatable tasks.

The build task will create a new build of the whole case study into the `dist` folder. To explore a built version, simply open the `dist/index.html` file in a browser.

```
npx gulp build
```

## Development

For development it is oftentimes very useful to automatically rebuild and reload an app. This case study uses Browsersync to implement this and the command to run a hot-reloadable live server is

```
npx gulp serve
```

or simply


```
npx gulp
```