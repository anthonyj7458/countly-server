window.NotificationsView = countlyView.extend({

  //need to provide at least empty initialize function
  //to prevent using default template
  initialize:function (){
    //we can initialize stuff here
  },

  beforeRender: function() {
  
    //check if we already have template
    if(this.template)
  
      //then lets initialize our mode
      return;
    else {
  
      //else let's fetch our template and initialize our mode in paralel
      var self = this;
      return $.when($.get(countlyGlobal["path"]+'/notifications/templates/notifications.html', function(src){

        //precompiled our template
        self.template = Handlebars.compile(src);
      }));
    }
  },

  //here we need to render our view
  renderCommon:function () {
  
    //provide template data
    this.templateData = {
        "page-title":jQuery.i18n.map["notifications.title"],
        "logo-class":""
    };

    //populate template with data and attach it to page's content element
    $(this.el).html(this.template(this.templateData));
  },

  //here we need to refresh data
  refresh:function () {
  }
});

//register views
app.notificationsView = new NotificationsView();

app.route('/manage/notifications', 'notifications', function () {
  this.renderWhenReady(this.notificationsView);
});

$( document ).ready(function() {
  var menu = '<a href="#/manage/notifications" class="item">'+
    '<div class="logo-icon fa fa-bars"></div>'+
    '<div class="text" data-localize="notifications.title"></div>'+
  '</a>';
  if($('#management-submenu .help-toggle').length)
    $('#management-submenu .help-toggle').before(menu);
});