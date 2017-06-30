/**
 * Copyright © Exocortex, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
  'jquery',
  'claraplayer',
  'jquery/ui',
], function($, claraPlayer) {
  $.widget('clara.player', {
    options: {

    },

    _init: function () {

    },

    _create: function () {
      var clara = claraPlayer('clara-player');
      clara.on('loaded', function() {
        console.log('Clara player is loaded and ready');
      });

      // Fetch and initialize the sceneId
      clara.sceneIO.fetchAndUse("6cfce43b-fd40-4624-bee6-7f911e9405dd");
    },

    _OnClick: function ($this, $widget) {

    }

  });

  return $.clara.player;
});
