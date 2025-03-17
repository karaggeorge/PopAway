import meow from 'meow';
import path from 'node:path';
import { execa } from 'execa';

const cli = meow(`
  Usage
    $ apple-plz-stop <input>

  Options
    --title, -t  Provide one or more title of a popup to block [Default: 'Turn On Reactions']
`, {
  importMeta: import.meta,
  flags: {
    title: {
      shortFlag: 't',
      type: 'string',
      default: ['Turn On Reactions'],
      isMultiple: true,
    }
  }
});

const binary = path.join(path.dirname(new URL(import.meta.url).pathname), 'cli');

const process = execa(binary, cli.flags.title);

let lastLine = '';

process.addListener('exit', (code) => {
  if (code === 1) {
    console.error('Task exited with an error: ', lastLine);
  }
});

process.addListener('spawn', () => {
  console.log('Titles: ', cli.flags.title);
  console.log('Watching for popups…');
});

try {
  for await (const raw of process) {
    const line = raw.toString().trim();
    lastLine = line;
  
    if (line.startsWith('j')) {
      try {
        const { content, closed } = JSON.parse(line.slice(1));
  
        const [title, ...rest] = content;
  
        console.log(`[${new Date().toISOString()}] ${closed ? 'Dismissed p' : 'P'}opup: "${title}" (${rest.join(' ')})`);
      } catch {
        // Do Nothing
      }
    }
  }  
} catch (error) {
  console.error(error);
}
