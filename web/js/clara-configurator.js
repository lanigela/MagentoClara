/**
 * Copyright © Exocortex, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
  'jquery',
  'underscore',
  'mage/template',
  'mage/smart-keyboard-handler',
  'mage/translate',
  'priceUtils',
  'claraplayer'
  'jquery/ui',
  'jquery/jquery.parsequery',
  'mage/validation/validation'
], function($, _, mageTemplate,  keyboardHandler, $t, priceUtils, claraPlayer) {
  'use strict';

  var globalOptions = {
    optionConfig: null
  };

  $.widget('clara.Configurator', {
    options: globalOptions,

    _init: function () {

    },

    _create: function () {
      console.log(this.options.optionConfig);
    },

    _OnClick: function ($this, $widget) {

    }

  });

  return $.clara.Configurator;
});
