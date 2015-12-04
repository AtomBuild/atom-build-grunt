'use babel';

import temp from 'temp';
import path from 'path';
import fs from 'fs-extra';
import { vouch } from 'atom-build-spec-helpers';
import { provideBuilder } from '../lib/grunt';

describe('grunt provider', () => {
  let directory;
  let builder;
  const Builder = provideBuilder();

  const setupGrunt = () => {
    const binGrunt = path.join(directory, 'node_modules', '.bin', 'grunt');
    const realGrunt = path.join(directory, 'node_modules', 'grunt-cli', 'bin', 'grunt');
    const source = path.join(__dirname, 'fixture/node_modules');
    const target = path.join(directory, 'node_modules');
    return vouch(fs.copy, source, target).then(() => {
      return Promise.all([
        vouch(fs.unlink, binGrunt),
        vouch(fs.chmod, realGrunt, parseInt('0700', 8))
      ]);
    }).then(() => vouch(fs.symlink, realGrunt, binGrunt));
  };

  beforeEach(() => {
    waitsForPromise(() => {
      return vouch(temp.mkdir, 'atom-build-spec-')
        .then((dir) => vouch(fs.realpath, dir))
        .then((dir) => directory = `${dir}/`)
        .then((dir) => builder = new Builder(dir));
    });
  });

  afterEach(() => {
    fs.removeSync(directory);
  });

  describe('when gruntfile exists', () => {
    it('should be eligible', () => {
      fs.writeFileSync(directory + 'Gruntfile.js', fs.readFileSync(__dirname + '/fixture/Gruntfile.js'));
      waitsForPromise(setupGrunt);
      runs(() => expect(builder.isEligible()).toBe(true));
    });

    it('should give targets as settings', () => {
      fs.writeFileSync(directory + 'Gruntfile.js', fs.readFileSync(__dirname + '/fixture/Gruntfile.js'));
      waitsForPromise(setupGrunt);
      waitsForPromise(() => {
        expect(builder.isEligible()).toBe(true);
        return builder.settings().then((settings) => {
          expect(settings.length).toBe(3);
          const real = settings.map(s => s.name).sort();
          const expected = [ 'Grunt: default', 'Grunt: dev task', 'Grunt: other task' ];
          expect(real).toEqual(expected);

          // Inspect one target closely
          const setting = settings.find(s => s.name === 'Grunt: dev task');
          expect(setting.sh).toBe(false);
          expect(setting.args).toEqual([ 'dev task' ]);
          expect(setting.exec).toEqual(`${directory}node_modules/.bin/grunt`);
        });
      });
    });

    it('should only contain default target if grunt is not installed', () => {
      fs.writeFileSync(directory + 'Gruntfile.js', fs.readFileSync(__dirname + '/fixture/Gruntfile.js'));
      runs(() => {
        expect(builder.isEligible()).toBe(true);
        builder.settings().then((settings) => {
          expect(settings.length).toBe(1);
          expect(settings[0].name).toEqual('Grunt: default');
        });
      });
    });
  });

  describe('when gruntfile does not exist', () => {
    it('should not be eligible', () => {
      expect(builder.isEligible()).toBe(false);
    });
  });
});
