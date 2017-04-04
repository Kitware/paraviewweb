# Developer guide

ParaViewWeb is an Open Source Framework for building
web applications for Scientific Visualization.

The following guide explains our software processes and the tools used to
build and develop this framework.

## Software process

We rely on [Semantic-release](https://github.com/semantic-release/semantic-release) to manage our change log, tagging and publishing
to [NPM](https://www.npmjs.com/package/paraviewweb) via [Travis](https://travis-ci.org/).

Semantic-release requires each commit message to follow a specific
format. To ensure that format, we use Commitizen, which can be triggered
via the following command line. Additional information can be found 
[here](https://gist.github.com/stephenparish/9941e89d80e2bc58a153).

    $ git cz

Then a set of questions will be presented to you like these:

    $ git cz
    cz-cli@2.4.6, cz-conventional-changelog@1.1.5

    Line 1 will be cropped at 100 characters. All other lines will be wrapped
    after 100 characters.

    ? Select the type of change that you're committing: (Use arrow keys)
      feat:     A new feature
      fix:      A bug fix
      docs:     Documentation only changes
    ❯ style:    Changes that do not affect the meaning of the code
                (white-space, formatting, missing semi-colons, etc)
      refactor: A code change that neither fixes a bug or adds a feature
      perf:     A code change that improves performance
    (Move up and down to reveal more choices)

    ? Denote the scope of this change ($location, $browser, $compile, etc.):
    ESLint

    ? Write a short, imperative tense description of the change:
    Update code formatting to comply with our ESLint specification

    ? Provide a longer description of the change:

    ? List any breaking changes or issues closed by this change:

Those answers will generate the following commit message:

    commit 1a31ecfcc2f6f4283e51187a24ce0e9d9c17ae54
    Author: Sebastien Jourdain <sebastien.jourdain@kitware.com>
    Date:   Mon Dec 21 09:29:21 2015 -0700

        style(ESLint): Update code formatting to comply with our ESLint specification

## Code editing

[Sublime Text 3](http://www.sublimetext.com) is recommended with the following set of plugins.

To install plugins, first install [Package constrol](https://packagecontrol.io/installation).
Then you can install new plugins with: ```Ctrl/Cmd + Shift + p``` Install

### Git + GitGutter

With GitGutter, you can see which lines have been added, deleted or modified in the gutter.

### Babel

This plugin adds proper syntax highlighting to your ES6/2015 and React JSX code.

### JsFormat

Once installed, to use JSFormat, go to your JS file and hit Ctrl + Alt + f on
Windows/Linux or Ctrl + ⌥ + f on Mac. Alternatively, use the context menu.

### Sublime-Linter + SublimeLinter-eslint

Highlight needed style fixes while editing. Finds common coding errors.
[More information available here](https://github.com/roadhump/SublimeLinter-eslint).

    $ npm install -g eslint

### EditorConfig

Fix white-space and indentation automatically while editing.
[More information available here](https://github.com/sindresorhus/editorconfig-sublime#readme)
