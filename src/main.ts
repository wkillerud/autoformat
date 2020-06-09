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
