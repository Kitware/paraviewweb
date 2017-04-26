## Development

We welcome your contribution to the development of ParaViewWeb. This document will help you through the process.

### Before You Start

Please follow the coding style:

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
- Use spaces, not tabs, with a two space indent.
- Don't put commas first.

### Workflow

1. Fork [kitware/paraviewweb](https://github.com/kitware/paraviewweb).
2. Clone the repository to your computer and install dependencies.

```sh
$ git clone https://github.com/<username>/paraviewweb.git
$ cd paraviewweb
$ npm install
```

3. Create a feature branch.

```sh
$ git checkout -b new_feature
```

4. Start hacking.
5. Test examples.

```sh
$ npm run doc:www
```

6. Use Commitizen for your commit message.

```sh
$ npm run commit
```

7. Push the branch.

```sh
$ git push --set-upstream origin new_feature
```

8. Create a pull request and describe the change.

### Notice

- Don't modify version number in `package.json`. It is changed automatically.
- Your pull request can only be merged when the tests have passed. Don't forget to run tests before submission.

```sh
$ npm test
```

## Testing Changes

Testing changes to UI components is done by running the documentation and examples locally
and viewing the results. To do that, run the following:

```sh
$ npm run doc:www
```

Then open a web browser to http://localhost:4000/paraviewweb to view 
the documentation and examples based on the locally modified ParaViewWeb.

## Updating Documentation

The ParaViewWeb documentation is part of the code repository.

## Reporting Issues

If you encounter problems when using ParaViewWeb, you can look for the solutions in [Troubleshooting](troubleshooting.html) or our [Mailing list](http://www.paraview.org/mailman/listinfo/paraview). If you can't find the answer, please report an issue on [GitHub](https://github.com/kitware/paraviewweb/issues). Thanks!
