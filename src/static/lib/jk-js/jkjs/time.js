/**
 * This package provides simple functionality for dealing with time.
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

jkjs.time = function() {

  var months = ['Jan', 'Feb', 'Mar',
                'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep',
                'Oct', 'Nov', 'Dec'];

  this.pretty = function(timestamp, msec) {
    var msec = msec || 0;
    var a = new Date(timestamp * 1000 + msec);
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = "00"+a.getDate();
    return year+' '+month+' '+date.substr(-2);
  }

}; // jkjs.time

jkjs.time = new jkjs.time(); // create instance
