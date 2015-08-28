'use babel';
'use strict';

var originalNodePath = process.env.NODE_PATH;

function provideBuilder() {

  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  return {
    niceName: 'Grunt',

    isEligable: function (cwd) {
      return fs.existsSync(path.join(cwd, 'Gruntfile.js'));
    },

    settings: function (cwd) {
      var createConfig = function (name, args) {
        var executable = /^win/.test(process.platform) ? 'grunt.cmd' : 'grunt';
        var localPath = path.join(cwd, 'node_modules', '.bin', executable);
        var exec = fs.existsSync(localPath) ? localPath : executable;
        return {
          name: name,
          exec: exec,
          sh: false,
          args: args
        };
      };

      return new Promise(function(resolve, reject) {
        /* This is set so that the spawned Task gets its own instance of grunt */
        process.env.NODE_PATH = util.format('%s%snode_modules%s%s', cwd, path.sep, path.delimiter, originalNodePath);

        require('atom').Task.once(require.resolve('./parser-task.js'), cwd, function (result) {
          if (result.error) {
            return resolve([ createConfig('Grunt: default', [ 'default' ]) ]);
          }

          var config = [];
          /* Make sure 'default' is the first as this will be the prioritized target */
          result.tasks.sort(function (t1, t2) {
            if ('default' === t1) {
              return -1;
            }
            if ('default' === t2) {
              return 1;
            }
            return t1.localeCompare(t2);
          });
          (result.tasks || []).forEach(function (task) {
            config.push(createConfig('Grunt: ' + task, [ task ]));
          });

          return resolve(config);
        });
      }).catch(function (err) {
        process.env.NODE_PATH = originalNodePath;
        throw err;
      });
    }
  };
}

module.exports.provideBuilder = provideBuilder;
