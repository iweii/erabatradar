var tab_url   = '';

exports.main = function() {
  
  var Request = require('sdk/request').Request;
  var self = require('sdk/self');
  var data = require('sdk/self').data;
  var ss = require('sdk/simple-storage');
  var tabs = require('sdk/tabs');
  var pm = require('sdk/page-mod');
  var pma = null;
  var bb = require('barbutton');
  ss.storage.logo_to_urlbar = [];

	var panel = require('sdk/panel').Panel({
		width: 200,
		height: 35,
		contentURL: data.url('info.html')
	});
   
  panel.on('hide', function(){
    Request({
      url: 'http://erabat.cz/rozsireni',
      content: {show_url:tab_url},
      onComplete: function() {
        worker.port.emit('enable', {});
        tab_action(tabs.activeTab);
      }
    }).post();
  });
	
	let barbutton = bb.BarButton({
		id: 'erabatradar-firefox-barbutton',
		image: data.url('icon016.png'),
		panel: panel.hide()
	});
		
	barbutton.collapsed(true);
	barbutton.setImage(data.url('icon016.png'));
   
  tabs.on('activate', tab_action2);
    
  function tab_action2(tab) {
    tab_url = get_hostname(tab.url);
    if(ss.storage.logo_to_urlbar[tab_url]) barbutton.collapsed(false);
    else barbutton.collapsed(true);
  }
    
  tabs.on('ready', tab_action);
    
  function tab_action(tab) {
    tab_url = tab.url;
    if ((typeof tab_url != 'undefined') && (tab_url.indexOf('about:') == -1)) {
      tab_url = get_hostname(tab_url);
      var feed = (ss.storage.feed) ? ss.storage.feed : '';
      Request({
        url: 'http://erabat.cz/rozsireni',
        content: {feed:feed},
        onComplete: function (response) {
          var respjson = response.json;
          if (respjson != null) {
            ss.storage.feed = respjson[0]['version'];
            respjson.splice(0,1);
            ss.storage.list = respjson;
          }
          var detail = ss.storage.list.filter(function(item){return item.domain==tab_url});
          if (detail.length > 0) {
            ss.storage.logo_to_urlbar[tab_url] = true;
            barbutton.collapsed(false);
            coupon_show(tab, tab_url, detail[0]);
          } else barbutton.collapsed(true);
        }
      }).post();
    }
  }
  
  function coupon_show(tab, tab_url, detail) {
    var login = (ss.storage.login) ? ss.storage.login : '';
    var password = (ss.storage.password) ? ss.storage.password : '';
    worker = tab.attach({
      contentScriptFile: [ self.data.url('jquery-1.11.0.min.js'), self.data.url('banner.js') ],
      contentScriptOptions: {
        frame: self.data.load('banner.html'),
        logo: self.data.url('logo.png'),
        shop_login: login,
        shop_password: password,
        addon_version: self.version,
        shop: detail
      }
    });
    worker.port.on('setLoginData', function(data) {
      ss.storage.login = data.erabat_login;
      ss.storage.password = data.erabat_password;
      worker.port.emit('getLoginData', {
        'erabat_login': ss.storage.login,
        'erabat_password': ss.storage.password,
      });
    });
    worker.port.on('PermanentClosed', function() {
      Request({
        url: 'http://erabat.cz/rozsireni',
        content: {stop_url:tab_url},
        onComplete: function (response) {}
      }).post();
    });
  }
  
  function get_hostname(url) {
    if (url.search('http') === 0) return url.match(/:\/\/(www\.)?(.[^/]+)/)[2];
    else return url.match(/(www\.)?(.[^/:]+)/)[2];
  }

};