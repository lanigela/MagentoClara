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
  'claraplayer',
  'jquery/ui',
  'jquery/jquery.parsequery',
  'mage/validation/validation'
], function($, _, mageTemplate,  keyboardHandler, $t, priceUtils, claraPlayer) {
  'use strict';

  $.widget('clara.Configurator', {
    options: {
      optionConfig: null
    },

    _init: function initClaraConfigurator() {

    },

    _create: function createClaraConfigurator() {
      console.log(this.options.optionConfig);
    }

  });

  return $.clara.Configurator;
});
