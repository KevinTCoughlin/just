import { paths, logger, transform, prettyPrintMarkdown, rushUpdate, downloadPackage } from 'just-scripts-utils';
import path from 'path';
import { readdirSync } from 'fs';
import fse from 'fs-extra';
import prompts from 'prompts';
import { execSync } from 'child_process';
import yargs from 'yargs';

function checkEmptyRepo(installPath: string) {
  return readdirSync(installPath).length === 0;
}

export async function initCommand(argv: yargs.Arguments) {
  const { installPath } = paths;

  // TODO: autosuggest just-stack-* packages from npmjs.org
  if (!argv.type) {
    let response = await prompts({
      type: 'select',
      name: 'type',
      message: 'What type of repo to create?',
      choices: [
        { title: 'Basic library', value: 'just-stack-single-lib' },
        { title: 'UI Fabric Web Application (React)', value: 'just-stack-uifabric' },
        { title: 'Monorepo', value: 'just-stack-monorepo' }
      ]
    });
    argv.type = response.type;
  }

  const name = path.basename(installPath);

  if (checkEmptyRepo(installPath)) {
    logger.info('Initializing the repo in the current directory');

    const templatePath = await downloadPackage(argv.type);

    if (templatePath) {
      transform(templatePath, installPath, { name });

      execSync('git init');
      execSync('git add .');
      execSync('git commit -m "initial commit"');

      if (argv.type.includes('monorepo')) {
        rushUpdate(installPath);
      }

      logger.info('All Set!');

      const readmeFile = path.join(installPath, 'README.md');
      if (fse.existsSync(readmeFile)) {
        logger.info('\n' + prettyPrintMarkdown(fse.readFileSync(readmeFile).toString()));
      }
    } else {
      logger.error('Having trouble downloading and extracting the template package');
    }
  } else {
    logger.warn('The current directory is not empty. Please initialize an empty directory.');
  }
}
