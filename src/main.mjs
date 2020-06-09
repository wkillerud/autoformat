import chalk from 'chalk';
import { hello } from './hello.mjs';
import { world } from './world.mjs';

function greet({ greeting, name } = { greeting: hello, name: world }) {
  console.log(chalk.bgMagenta(`${greeting}, ${name}`));
}

greet();
