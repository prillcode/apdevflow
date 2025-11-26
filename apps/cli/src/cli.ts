#!/usr/bin/env node
import { Command } from 'commander';
import { APP_NAME, APP_VERSION } from '@apdevflow/shared';

const program = new Command();

program
  .name('devflow')
  .description('APDevFlow - AI-Powered Development Workflow Platform')
  .version(APP_VERSION);

program
  .command('start <story-id>')
  .description('Start work on a story (creates workspace)')
  .action((storyId: string) => {
    console.log(`Starting work on story: ${storyId}`);
    console.log('(Implementation coming soon)');
  });

program
  .command('finish <story-id>')
  .description('Finish work on a story (uploads artifacts)')
  .action((storyId: string) => {
    console.log(`Finishing story: ${storyId}`);
    console.log('(Implementation coming soon)');
  });

program
  .command('list')
  .description('List your assigned stories')
  .action(() => {
    console.log('Your assigned stories:');
    console.log('(Implementation coming soon)');
  });

program
  .command('skills')
  .description('Manage APDevFlow skills')
  .action(() => {
    console.log('Skill management:');
    console.log('(Implementation coming soon)');
  });

program.parse();
