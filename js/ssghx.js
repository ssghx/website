$(function() {

// global forms state;
var cleanForms = function(){};

// provide opts.staticRoot and location.origin also for forms
var opts = {};
opts.staticRoot = location.pathname.slice(0, location.pathname.length - pubRef.href.length);

// http://tosbourn.com/a-fix-for-window-location-origin-in-internet-explorer/
if (!location.origin) { location.origin = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: ''); }

// load generator on browsers that are up to it
if (history && history.pushState) {
  $.getScript(pubRef.relPath + '/pub/_generator.js');
  window.onGeneratorLoaded = initClientSide;
}

// initialize contact and other form handlers (both SPA and non-SPA modes)
initForms();
initScrollmon();

// start SPA mode
function initClientSide(g) {
  var generator = g;
  opts = generator.opts;
  var log = opts.log;
  var u = generator.util;

  // search state
  var lastSearch = '';
  var cleanSearch = function(){};

  // initialize SPA events
  pager = generator.initPager();
  generator.on('nav', function() { $('html,body').scrollTop(0); });
  generator.on('before-update-view', cleanAllViews);
  generator.on('after-update-view', initAllViews);

  // force reload after server save
  generator.on('notify', function(msg) {
    if (msg === 'save') {
      log('server save. reloading! (disable watcher with `pub -K`)');
      location.reload();
    }
  });

  // call initSearch() immediately
  u.set(generator, 'req.query', u.parseUrlParams(location.search));
  initSearch();

  // initialize SPA-only client-side search
  function initSearch() {

    // search UI
    var $search = $('#search');
    if (!$search.length) return; // do nothing if this is isn't a search page

    var $clear = $('#search-clear');
    var $results = $('#search-results');

    // event handlers on
    $search.on('search', searchInput); // chrome X button
    $search.on('focus',  searchInput);
    $search.on('keyup',  searchInput);
    $clear.on('click',   searchClear);

    // event handlers off
    cleanSearch = function() {
      $search.off('search', searchInput);
      $search.off('focus',  searchInput);
      $search.off('keyup',  searchInput);
      $clear.off('click',   searchClear);
      cleanSearch = u.noop; // call once
    }

    // support urls with q param, preserve search input value
    var query = u.get(generator, 'req.query.q', lastSearch);
    if (query) {
      search(query);
    }

    function searchInput(evt) {
      var txt = $search.val();
      if (txt === lastSearch) return;
      search(txt);
    }

    function searchClear(evt) {
      search('');
    }

    function search(txt) {
      lastSearch = txt;
      $search.val(txt);

      u.set(generator, 'req.query.q', txt);
      cleanScrollmon();
      $results.html(generator.renderTemplate(pager.page, 'projects/summaries'));
      initScrollmon();
    }
  }

  // remove all event handlers
  function cleanAllViews($el) {
    cleanSearch();
    cleanForms();
    cleanScrollmon();
  }

  // initialize all event handlers
  function initAllViews($el) {
    initSearch();
    initForms();
    initScrollmon();
  }
}



function initForms() {
  $forms = $('#form');
  if (!$forms.length) return;
  $('#location').val(location.origin + opts.staticRoot);

  $forms.on('submit', validateForm);

  cleanForms = function() {
    $forms.off('submit', validateForm);
  }

  var revalidatingOnChange = false;

  function validateForm(evt) {
    var $form = $(this);
    var vals = formValues();

    if (!checkRequired($form, vals) || !confirmSame($form, vals)) {
      if (!revalidatingOnChange) {
        $form.on('change', validateForm);
        revalidatingOnChange = true;
      }
      $('#validated').val('');
      evt.preventDefault();
    }
    else {
      $('#validated').val('jawohl!');
    }

    // collect field values (only one per name!) into object o
    function formValues() {
      var o = {};
      $.each($form.serializeArray(), function(idx, v){ o[v.name] = v.value; });
      return o;
    }
  }
}

// make sure pw and confirm pw values are the same
function confirmSame($form, values) {
  if (('Password' in values) && (values['Password'] != values['Confirm password'])) {
    $('[for=password]').addClass('mismatched');
    return false;
  }
  else {
    $('[for=password]').removeClass('mismatched');
    return true;
  }
}

// set/remove .missing class on required fields, return false if any missing
function checkRequired($form, values) {
  var sel = 'input[required], select[required], textarea[required]';
  var msgs = [];

  $form.find(sel).each(function() {
    var $fld = $(this);
    if (! $fld.is(':disabled')) {
      var name = $fld.attr('name');
      var missing = !values[name];
      var id = $fld.attr('id');
      var label = $('[for='+id+']:visible');
      if (missing) {
        label.addClass('missing');
        msgs.push(name);
      }
      else { label.removeClass('missing'); }
    }
  });
  if (msgs.length) {
    $('.form-error').text(msgs.join('\n')).show();
    return false;
  } else {
    $('.form-error').hide();
    return true;
  }
}

function initScrollmon() {
  $('.scrollmon').each(function() {
    var $el = $(this);
    var src = $el.data('src');
    var watcher = scrollMonitor.create(this, 500);
    watcher.enterViewport(function() {
      $el.attr('src',src);
      watcher.destroy();
    });
  });
}

function cleanScrollmon() {
  scrollMonitor.destroyAll();
}


}) // $(function() {
