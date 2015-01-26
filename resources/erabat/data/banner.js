$(document).ready(function() {

  function escapeHTML(str) str.replace(/[&"<>]/g, function (m) escapeHTML.replacements[m]);
  escapeHTML.replacements = { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" };
  
  var erabat_login    = self.options.shop_login;
  var erabat_password = self.options.shop_password;
  var status = checkStatus();
  
  if ($('#eRabatRadar').length==0) {
    if ($.inArray(status,['enabled','activating'])>=0) shiftBody(true);
    $('body').prepend(self.options.frame
      .replace(/{{LOGO}}/g, self.options.logo)
      .replace(/{{TITLE}}/g, escapeHTML(self.options.shop.title))
      .replace(/{{CASHBACK}}/g, escapeHTML(self.options.shop.cashback.indexOf('%')<0?self.options.shop.cashback+' Kč':self.options.shop.cashback))
      .replace(/{{ID}}/g, escapeHTML(self.options.shop.id))
      .replace(/{{MNEMONIC}}/g, escapeHTML(self.options.shop.mnemonic))
      .replace(/{{URL}}/g, window.location.href)
      .replace(/{{VERSION}}/g, escapeHTML(self.options.addon_version))
    );
    if ($.inArray(status,['enabled','activating'])<0) $('#eRabatRadar').css('display','none');
    else {
      if (status==='enabled') { $('.erabatradar_enabled').css('display','initial'); $('.erabatradar_activating').css('display','none'); }
      if (status==='activating') {
        $('.erabatradar_activating').css('display','initial');
        $('.erabatradar_enabled').css('display','none');
        $('.erabatradar_btns').css('visibility','hidden');
        closeTimer($('.erabatradar_seconds'),3);
        document.cookie = 'eRabatRadar=shopping;path=/';
        status = 'shopping';
      }
    }
    $('#erabat_close').click(function() {
      self.port.emit("PermanentClosed");
      $('#erabat_form').fadeOut();
      $('#eRabatRadar').fadeOut();
      shiftBody(false);
      document.cookie = 'eRabatRadar=disabled;path=/';
    });
  } else {
    if ($('#eRabatRadar').css('display')==='none') {
      $('#eRabatRadar').fadeIn();
      $('#erabat_form').css('display','none');
      $('#erabat_change').css('display','inline');
      $('.erabatradar_enabled').css('display','initial');
      $('.erabatradar_activating').css('display','none');
      $('.erabatradar_btns').css('visibility','initial');
      $('#erabat_chancl').css('display','none');
      shiftBody(true);
    }
  }
  if (erabat_login.length>0) $('#erabat_user').html(erabat_login);
  else $('#erabat_user').html('(účet není nastaven)');
  $('#erabat_form_user').val(erabat_login);
  $('#erabat_form_pass').val(erabat_password);

  $('#erabat_go2store').click(function() {
    if (erabat_login.length>0 && erabat_password.length>0) {
      document.cookie = 'eRabatRadar=activating;path=/';
      $('#erabat_go2store_form').submit();
    } else {
      $('#erabat_form').fadeIn();
      $('#erabat_change').css('display','none');
      $('#erabat_chancl').css('display','inline');
    }
    return false;
  });
  
  $('#erabat_change').click(function() {
    $('#erabat_form').fadeIn();
    $(this).css('display','none');
    $('#erabat_chancl').css('display','inline');
  });
  
  $('#erabat_chancl').click(function() {
    $('#erabat_form').fadeOut();
    $('#erabat_change').css('display','inline');
    $(this).css('display','none');
  });
  
  $('#erabat_save').click(function() {
    $('#erabat_change').css('display','inline');
    $('#erabat_chancl').css('display','none');
    self.port.emit('setLoginData',{
      'erabat_login':$('#erabat_login').val(),
      'erabat_password':$('#erabat_password').val()
    });
    if (erabat_login.length>0) $('#erabat_user').html(erabat_login);
    else $('#erabat_user').html('(účet není nastaven)');
    $('#erabat_form_user').val(erabat_login);
    $('#erabat_form_pass').val(erabat_password);
    $('#erabat_form').fadeOut();
    return false;
  });
  
  function shiftBody(shift) {
    var body = (shift===true) ? [50,0,50,50] : [-50,50,100,-50];
    $('body').css('paddingTop',(parseInt($('body').css('paddingTop'))+body[0])+'px');
    $('*').filter(function() {
      if ($.inArray($(this).css('position'),['fixed','absolute'])>=0
        && $(this).parents().filter(function(){
          return typeof $(this).css('position')==='undefined' ||
            ($.inArray($(this).css('position'),['fixed','absolute','relative'])>=0 && $.inArray($(this).prop('tagName').toLowerCase(),['body'])<0);
        }).length===0) $(this).css('top',(parseInt($(this).css('top'))+body[3])+'px');
    });
    $('body,html').filter(function() {
      if ($(this).css('background').indexOf('url')>-1) {
        var currbgpos = $(this).css('backgroundPosition').split(' ');
        if (currbgpos.length<2) currbgpos[1] = currbgpos[0];
        if (currbgpos[1].slice(-1)!=='%' || parseInt(currbgpos[1])===0) {
          var style = (typeof $(this).attr('style')!=='undefined') ? $(this).attr('style')+';' : '';
          $(this).attr('style',style+'background-position: '+currbgpos[0]+' '+(parseInt(currbgpos[1])+body[0])+'px !important;');
        }
      }
    });
  }
  
  function closeTimer(element,remaining) {
    if (remaining>0) {
      var word = 'sekund'; if (remaining<5) word = 'sekundy'; if (remaining===1) word = 'sekundu';
      element.html(remaining+' '+word);
      setTimeout(function(){closeTimer(element,remaining-1);},1000);
    } else {
      $('#eRabatRadar').fadeOut();
      shiftBody(false);
    }
  }

  self.port.on("getLoginData", function(stored){
    $("#erabat_user").html(stored.erabat_login);
    $('#erabat_form_user').val(stored.erabat_login);
    $('#erabat_form_pass').val(stored.erabat_password);
    erabat_login    = stored.erabat_login;
    erabat_password = stored.erabat_password;
  });
  
  self.port.on('enable', function(){
    document.cookie = 'eRabatRadar=enabled;path=/';
  });
  
  function checkStatus() {
    if (document.cookie.indexOf('eRabatRadar')<0) return 'enabled';
    var cookies = document.cookie.split('; ');
    for (var c=0;c<cookies.length;c++) {
      if (cookies[c].indexOf('eRabatRadar')<0) continue;
      return cookies[c].substring(12);
    }
    return 'enabled';
  }

});