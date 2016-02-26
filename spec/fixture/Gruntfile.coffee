module.exports = (grunt) ->
  'use strict'

  grunt.initConfig {}

  grunt.registerTask 'other task', ->
    console.log 'doing heavy machinery stuff'
    return

  grunt.registerTask 'default', ->
    console.log 'Surprising is the passing of time. But not so, as the time of passing'
    return

  grunt.registerTask 'dev task', ->
    console.log 'doing dev build'
    return

  return
