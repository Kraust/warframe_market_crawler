// Test

var request = require('request');
var math = require('mathjs');
var items = require('./items');
var nano = require('nano')('http://localhost:5984');

var mod_db = nano.db.use('mod_db');

var NUMBER_TO_PARSE = 5;
// process.argv[2] = item name.

function search(mod_id) {
    
    var mod_db = nano.use('mod_db');
        
    request("https://api.warframe.market/v1/items/" + mod_id + "/orders?include=item", function(error, response, body) {
        //console.log('error: ', error);
        //console.log('statusCode: ', response && response.statusCode);
        //console.log('body: ', body);	
        
        console.log(mod_id);
        
        var results = [];
        var data = JSON.parse(body);
                
        var item_data = data.include.item.items_in_set.filter(a=>a.url_name == mod_id);
                
        var item_name = item_data[0].en.item_name;
        
        data = data.payload.orders.filter(((a=>a.user.status == "ingame") || (a=>a.user.status == "online")));
        data = data.filter((a=>a.order_type == "sell"));
        
        data.forEach(function(res) {
            //console.log(res.user.ingame_name + " " + res.platinum);
            results.push(res.platinum);
        });
        
        var to_parse = NUMBER_TO_PARSE;
                
        results.sort(cmp);
        //console.log(results);
        
        results = results.splice(0, NUMBER_TO_PARSE);
        
        if(results.length > 0)
        {
            var item_mean = math.round(mean(results));
            var item_std = math.round(math.std(results));
        }
        else
        {
            var item_mean = "0";
            var item_std = "0";
        }        
        
        //console.log("Mean Price (lowest " + NUMBER_TO_PARSE + " offsers): " + item_mean);
        //console.log("Standard Deviation (lowest " + NUMBER_TO_PARSE + " offsers): " + item_std);
        //console.log("=================");
        
        mod_db.get(item_name, function(err, body) {
            if(body)
            {
                var cur_rev = body._rev;
                mod_db.insert({ _id: item_name, _rev: cur_rev, item_id: mod_id, mean: item_mean, std: item_std}, function(err, body) {
                    if(err) {
                        console.log(err);
                    }
                });
            }
            else
            {
                mod_db.insert({ _id: item_name, _rev: cur_rev, item_id: mod_id, mean: item_mean, std: item_std}, function(err, body) {
                    if(err) {
                        console.log(err);
                    }
                });

            }
        });       

    });
}

function cmp(a,b)
{
    return a - b;
}

function mean(numbers) {
    var total = 0, i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}

//search("smite_infested");
//search(process.argv[2]);

items.mod_db.forEach(function(res) {
    search(res);
});

