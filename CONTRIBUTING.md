## Development

We welcome you to join the development of ParaViewWeb. This document will help you through the process.

### Before You Start

Please follow the coding style:

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
- Use soft-tabs with a two space indent.
- Don't put commas first.

### Workflow

1. Fork [kitware/paraviewweb].
2. Clone the repository to your computer and install dependencies.

```sh
$ git clone https://github.com/<username>/paraviewweb.git
$ cd paraviewweb
$ npm install
$ npm install -g commitizen
```

3. Create a feature branch.

```sh
$ git checkout -b new_feature
```

4. Start hacking.
5. Use Commitizen for commit message

```sh
$ git cz
```

6. Push the branch:

```sh
$ git push origin new_feature
```

6. Create a pull request and describe the change.

### Notice

- Don't modify version number in `package.json`.
- Your pull request will only get merged when tests passed. Don't forget to run tests before submission.

```sh
$ npm test
```

## Updating Documentation

The ParaViewWeb documentation is part of the code repository.

## Reporting Issues

When you encounter some problems when using ParaViewWeb, you can find the solutions in [Troubleshooting](troubleshooting.html) or ask me on [GitHub](https://github.com/kitware/paraviewweb/issues) or [Mailing list](http://www.paraview.org/mailman/listinfo/paraview). If you can't find the answer, please report it on GitHub.
