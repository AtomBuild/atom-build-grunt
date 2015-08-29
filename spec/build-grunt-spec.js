'use strict';

var temp = require('temp');
var path = require('path');
var fs = require('fs-extra');
var specHelpers = require('atom-build-spec-helpers');

describe('grunt provider', function() {
  var directory;
  var workspaceElement;

  var setupGrunt = function () {
    var binGrunt = path.join(directory, 'node_modules', '.bin', 'grunt');
    var realGrunt = path.join(directory, 'node_modules', 'grunt-cli', 'bin', 'grunt');
    var source = path.join(__dirname, 'node_modules');
    var target = path.join(directory, 'node_modules');
    return specHelpers.vouch(fs.copy, source, target).then(function () {
      return Promise.all([
        specHelpers.vouch(fs.unlink, binGrunt),
        specHelpers.vouch(fs.chmod, realGrunt, parseInt('0700', 8))
      ]);
    }).then(function () {
      return specHelpers.vouch(fs.symlink, realGrunt, binGrunt);
    });
  };

  beforeEach(function () {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    jasmine.unspy(window, 'setTimeout');
    jasmine.unspy(window, 'clearTimeout');

    waitsForPromise(function() {
      return specHelpers.vouch(temp.mkdir, 'atom-build-spec-').then(function (dir) {
        return specHelpers.vouch(fs.realpath, dir);
      }).then(function (dir) {
        directory = dir + '/';
        atom.project.setPaths([ directory ]);
      }).then(function () {
        return Promise.all([
          atom.packages.activatePackage('build'),
          atom.packages.activatePackage('build-grunt')
        ]);
      });
    });
  });

  afterEach(function() {
    fs.removeSync(directory);
  });

  it('should show the build panel if a Gruntfile exists', function() {
    expect(workspaceElement.querySelector('.build')).not.toExist();

    waitsForPromise(setupGrunt);

    runs(function () {
      fs.writeFileSync(directory + 'Gruntfile.js', fs.readFileSync(__dirname + '/Gruntfile.js'));
      atom.commands.dispatch(workspaceElement, 'build:trigger');
    });

    waitsFor(function() {
      return workspaceElement.querySelector('.build .title') &&
        workspaceElement.querySelector('.build .title').classList.contains('success');
    });

    runs(function() {
      expect(workspaceElement.querySelector('.build')).toExist();
      expect(workspaceElement.querySelector('.build .output').textContent).toMatch(/Surprising is the passing of time. But not so, as the time of passing/);
    });
  });

  it('should run default target if grunt is not installed', function () {
    fs.writeFileSync(directory + 'Gruntfile.js', fs.readFileSync(__dirname + '/Gruntfile.js'));
    atom.commands.dispatch(workspaceElement, 'build:trigger');

    waitsFor(function() {
      return workspaceElement.querySelector('.build .title') &&
        workspaceElement.querySelector('.build .title').classList.contains('error');
    });

    runs(function() {
      expect(workspaceElement.querySelector('.build .output').textContent).toMatch(/^Executing: grunt/);
    });
  });

  it('should list Grunt targets in a SelectListView', function () {
    waitsForPromise(setupGrunt);
    fs.writeFileSync(directory + 'Gruntfile.js', fs.readFileSync(__dirname + '/Gruntfile.js'));

    runs(function () {
      atom.commands.dispatch(workspaceElement, 'build:select-active-target');
    });

    waitsFor(function () {
      return workspaceElement.querySelector('.select-list li.build-target');
    });

    runs(function () {
      var list = workspaceElement.querySelectorAll('.select-list li.build-target');
      var targets = Array.prototype.slice.call(list).map(function (el) {
        return el.textContent;
      });
      expect(targets).toEqual([ 'Grunt: default', 'Grunt: dev task', 'Grunt: other task', ]);
    });
  });

  it('should still list the default target for Grunt if it is unable to extract targets', function () {
    fs.writeFileSync(directory + 'Gruntfile.js', fs.readFileSync(__dirname + '/Gruntfile.js'));

    runs(function () {
      atom.commands.dispatch(workspaceElement, 'build:select-active-target');
    });

    waitsFor(function () {
      return workspaceElement.querySelector('.select-list li.build-target');
    });

    runs(function () {
      var list = workspaceElement.querySelectorAll('.select-list li.build-target');
      var targets = Array.prototype.slice.call(list).map(function (el) {
        return el.textContent;
      });
      expect(targets).toEqual([ 'Grunt: default' ]);
    });
  });
});
