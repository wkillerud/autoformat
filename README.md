# Automatically enforce a consistent code style across a frontend project

When teams work on the same code base I find it valuable that everyone agrees on and writes in a common style. It makes it easier to navigate a code base, and spares code reviewers from dealing with minor details.

Adhering to a code style can be time- and energy consuming. More and more communities see value in having tools - official or _de facto_ - do some of the work. In JavaScript [Prettier](http://prettier.io) has established itself as the standard for automatic formating. I like to augment Prettier with [ESLint](http://eslint.org) and a [plugin to sort `import`s](https://github.com/benmosher/eslint-plugin-import). Here is how I set these tools up for both JavaScript and TypeScript projects.

## Optional: Set up a test project

I assume some prior knowledge of JavaScript, TypeScript, and the command line. I also assume you have installed:

- Git
- Node LTS (12.18.0 at time of writing)
- npm

In case you don't have an existing project to work on, spend a few minutes to set one up. I'll be using the example project made here to show how the tools work later on.

You _can_ use something like `create-react-app`, but I'm not assumeing anything about frameworks here. If you use React, know that ESLint will need some extra plugins not covered here.

You could also cheat and clone the finished project from this repo. Check out the `javascript` tag (spoilers: you'll be adding TypeScript later on).

First create a project folder and go to it:

```sh
$ mkdir autoformat && cd autoformat
$ npm init # Accept all the defaults
$ git init
```

Add a `.gitignore`-file in the same folder as `package.json` with this content:

```
node_modules/
```

Make a `src/` directory and add three files to it:

```
src/
  - hello.mjs
  - main.mjs
  - world.mjs
.gitignore
package.json
```

`.mjs` is a file extension that lets you use the new module syntax (`import/export`) in Node. It is still experimental in version 12.18.0.

Install `chalk` to see how external dependencies behave with the automatic formatting:

```sh
$ npm install chalk
```

Then add some code to the three files you made, and you're ready to get to the meat of the post:

```js
// hello.mjs
export const hello = 'Hello';
```

```js
// world.mjs
export const world = 'World';
```

```js
// main.mjs
import chalk from 'chalk';
import { hello } from './hello';
import { world } from './world';

function greet({ greeting, name } = { greeting: hello, name: world }) {
  console.log(chalk.bgMagenta(`${greeting}, ${name}`));
}

greet();
```

Run the script with Node if you want to confirm its behavior:

```sh
$ node src/main.mjs
```

## Prettier

I recommend you add one tool at a time, starting with [Prettier](http://prettier.io).

```sh
$ npm install prettier
```

Prettier is intentional about having few options, and the default options are sensible. If you do want to configure Prettier or be explicit about the options you can use a `.prettierrc`-file. For instance, this is the one I use:

```json
{
  "singleQuote": true
}
```

The first time you introduce Prettier to a project you may want to let it loose on your entire codebase. Otherwise all pull requests will have a huge diff with unrelated changes until you edit each file in the project once. I prefer a big bang introduction of Prettier. To let it rip, commit any changes you might have in your project, and then run this command:

```sh
$ ./node_modules/.bin/prettier "src/**/*" --write
```

This will go through all files in your project, run them through Prettier, and write the changes back to disk. This happens in-place with no backsies 🚧. Do a cursory check of your project and commit the changes if you’re happy.

Make a few changes in your code:

- Add a loooooooong line
- Use `var` or `let` when a variable doesn't change
- Add some random line breaks and indentations

Rerun Prettier and see how the code changes. Pretty neat, huh?

## ESLint

Next, install and configure [ESLint](http://eslint.org). Since ESLint and Prettier have some overlap you need a plugin to help the two tools coexist. Also install [a plugin](https://github.com/benmosher/eslint-plugin-import) to handle ordering of `import` statements in your files.

```sh
$ npm install eslint \
  eslint-config-prettier \
  eslint-config-import \
  eslint-plugin-prettier \
  eslint-plugin-import
```

Like Prettier, you configure ESLint with a file – in this case `.eslintrc.json`:

```json
{
  "parserOptions": {
    "sourceType": "module"
  },
  "env": {
    "es2020": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:prettier/recommended"
  ],
  "plugins": ["prettier", "import"],
  "rules": {
    "prettier/prettier": ["error", { "singleQuote": true }],
    "import/order": [
      "error",
      {
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "never"
      }
    ]
  }
}
```

A quick summary of the configuration above:

- Let ESLint know you're using Node with modern features
- Extend (use) the basic recommended ruleset from ESLint
- Add the recommended rules from the `import` config (errors and warnings)
- Amend the previous rules to work with Prettier using the recommended Prettier rules
- Declare the plugins we use
- Override the default rules with our own. In this case to match `.prettierrc`, and configure how we want import statements ordered.

If you introduce ESLint to an existing project for the first time the number of errors and warnings can be overwhelming. ESLint ships with a `--fix` option that can resolve some issues for you, but often you'll still have several hundred errors and warnings. A strategy is to reconfigure the rules that give errors to give warnings instead. Then, turn one rule at a time back to being an error and fix that particular error everywhere in your codebase.

To confirm ESLint is working as intended try changing the order of some `import` statements. Then run this command and see what happens:

```sh
$ ./node_modules/.bin/eslint "src/**/*" --fix
```

You should end up with external dependencies declared first in alphabetical order. Then internal dependencies in alphabetical order based on their file name.

## Format and lint on commit

To run the style enforcement on any committed code, install [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged). These tools let you run binaries from `node_modules` and `npm` scripts as part of the Git pre-commit hook. That way you can make sure that all code passes the lint rules and conforms to the same style.

```
$ npm install husky lint-staged
```

You configure `lint-staged` in `package.json`. Add this below your dependencies:

```
{
  ...
  "lint-staged": {
    "src/**/*.{js,mjs}": [
      "eslint --fix"
    ],
    "src/**/*.{js,mjs,json,css}": [
      "prettier --write"
    ]
  }
}
```

In addition, run this command:

```
npm set-script lint-staged "lint-staged"
```

Husky is prepared in a few steps. First, create and run an NPM script `prepare` like this:

```
npm set-script prepare "husky install"
npm run prepare
```

Then, create a pre-commit hook like this:

```
npx husky add .husky/pre-commit "npm run lint-staged"
git add .husky/pre-commit
```

Try making the changes you did earlier for Prettier and ESLint, but don't run the commands manually. Instead, add and commit the files to see what happens. `husky` will run `lint-staged` which in turn runs `eslint` and `prettier`, then adds any changes to the commit. Cool!

## One step further - format and lint on save

This is all well and good, but you don't want to look at unformatted code too long while working. Most capable text editors will let you run arbitrary commands as part of a Save action. I'm using [Visual Studio Code](https://code.visualstudio.com) (VS Code) as an example, but your favorite text editor should be able to do this as well. Go check out the documentation!

If you use VS Code too, here is how you can configure it to format on save.

First, install the Prettier (`esbenp.prettier-vscode`) and ESLint (`dbaeumer.vscode-eslint`) extensions.

If you work in a team you may want to share these settings between developers. So, make a `.vscode/` folder if it doesn't exist already and then add a `settings.json` file and an `extensions.json` file:

```
.vscode/
  - extensions.json
  - settings.json
...
package.json
```

Add the plugins mentioned above to `extensions.json`. This way other developers get them as recommendations when they work on the project:

```json
{
  "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
}
```

In `settings.json` you want to add these entries:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "[javascript]": {
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.formatOnSave": true
  },
  "eslint.enable": true,
  "eslint.validate": ["javascript", "javascriptreact"]
}
```

This turns on _format on save_ for JavaScript files, as well as `.jsx` files. If you don't use React you can stick to configuring `javascript`. Again, try making the changes you did earlier when testing the commit hook, but this time only save. The file should get the correct format right away.

OK, cool. So why do a pre-commit hook at all? A pre-commit hook is still useful for those times you or your teammates don't use VS Code. Ever done a quick change in `vim` or Notepad++ that ended up breaking something? Yeah, me too.

## Add TypeScript to the mix

[TypeScript](http://typescriptlang.org) gets used in more and more projects. The added type safety helps rule out a class of problems that sometimes sneak up on you in JavaScript. In editors that tap into the language, like VS Code, TypeScript gives you excellent documentation and code completion. It also lets you do some powerful refactoring that you otherwise would do with careful text replacement.

Here is how you add TypeScript to the test project and reconfigure your tools to work in this new setting.

First, add TypeScript:

```
$ npm add typescript
```

Then add a configuration file for TypeScript - `tsconfig.json`:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "module": "commonjs",
    "outDir": "dist",
    "strict": true,
    "sourceMap": true,
    "target": "ES2019"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

Next, change the project file extensions from `.mjs` to `.ts`. Fix the import statements in `main.ts` by removing the file extensions:

```ts
import { hello } from './hello';
import { world } from './world';
```

Then run the TypeScript compiler:

```sh
$ ./node_modules/.bin/tsc
```

You should see a `dist/` folder made containing JavaScript files and source maps. You may need to quit and restart VS Code if the compiler complains.

Confirm the JavaScript works if you want by running Node:

```sh
$ node dist/main.js
```

## Reconfigure the tools to support TypeScript

Both ESLint, `lint-staged`, and VS Code need some changes to work with TypeScript.

Start with VS Code. Update `.vscode/settings.json` to also format `typescript` and `typescriptreact` on save:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "[javascript]": {
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.formatOnSave": true
  },
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

To fix `lint-staged` update the file extensions in `package.json`:

```json
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix"
    ],
    "src/**/*.{ts,json,css}": [
      "prettier --write"
    ]
  }
```

By default ESLint assumes files are JavaScript, so if it encounters TypeScript syntax it will break without the proper configuration.

Add [`@typescript-eslint/parser` and its related plugin](https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md) to the project:

```sh
$ npm install \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin
```

Then edit `.eslintrc.json`. Point ESLint to the new parser, add the new plugin, and add TypeScript-specific rules:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:prettier/recommended"
  ],
  "plugins": ["@typescript-eslint", "prettier", "import"],
  "rules": {
    "prettier/prettier": ["error", { "singleQuote": true }],
    "import/order": [
      "error",
      {
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "never"
      }
    ]
  }
}
```

Add typings to `main.ts` to confirm everything is working:

```ts
import chalk from 'chalk';
import { hello } from './hello';
import { world } from './world';

interface IGreeting {
  hello: string;
  name: string;
}

function greet(greeting: IGreeting = { hello: hello, name: world }) {
  const { hello, name } = greeting;
  console.log(chalk.bgMagenta(`${hello}, ${name}`));
}

greet();
```

Then go nuts - change import orders, add long lines, random indents, whatever. See that your code still gets formatted and linted on save and on commit.

## Final words

If you've followed along then your configuration should look something like in this repo.

This may seem like a lot of work for very little, but let me tell you – writing code and _never_ having to deal with formating is the bee's knees 🐝. Once this gets established in your team you'll also _never_ have to comment on indentation and formating again, or deal with fixing them. Try it, you'll never go back - I promise!
