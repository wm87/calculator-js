"use strict";

import { } from './ui.js'
import { } from './utils.js';
import { } from './calc.js';
import { } from './bin.js';
import { updateDisplay } from './plot.js';


$(document).ready(function () {

  // Default-Ansicht: Textarea aktiv
  $('.textarea-view').addClass('active');

  $('.switch-btn').click(function () {
    const view = $(this).data('view');
    $('.view').removeClass('active');
    $('.' + view + '-view').addClass('active');
  });



  $("#calculator").on("click", ".btn, .sub-btn", function () {
    if ($(this).attr('id') === 'backspace') return;
    const value = $(this).data("value") !== undefined ? $(this).data("value") : $(this).text();
    updateDisplay(value);
  });

});