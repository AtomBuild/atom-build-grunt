'use babel';

/**
 * This has to be done in a separate task since Grunt depends
 * on stuff that does unsafe evals. We don't want, and are not
 * allowed to do this in the context of the Atom application.
 */

let grunt;
try {
  grunt = require('grunt');
} catch (e) { /* do nothing */ }

module.exports = function (path) {
  try {
    if (!grunt) {
      throw new Error('Grunt is not installed.');
    }

    process.chdir(path);

    /* eslint-disable no-native-reassign, no-undef */
    /* When spawning this, we are not a browser anymore. Disable these */
    navigator = undefined;
    window = undefined;
    /* eslint-enable no-native-reassign, no-undef */

    require(path + '/Gruntfile.js')(grunt);
    return { tasks: Object.keys(grunt.task._tasks) };
  } catch (e) {
    return { error: { message: e.message } };
  }
};
