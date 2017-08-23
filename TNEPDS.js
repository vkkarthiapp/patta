var objMain = {
    Notifications : { 
    // "key" : "value"
        //"Please checkout our new radio app" : '<a href="https://play.google.com/store/apps/details?id=com.liteindia.TamilRadio">Tamil Internet Radio</a>',
        "Issue with few consumer numbers" : "One of the TNEB/Tangedco server is not working as expected,hence we could not reterive information for few consumer numbers.This will be resolved once it is fixed by TNEB department."
    },
    CustomHtml : 'Music lovers! Checkout our new <a href="market://details?id=com.liteindia.TamilRadio"><b>Tamil Internet Radio</b></a> Application! ',
    Root : 'http://tneb.tnebnet.org/newlt/menu3.html',
    Captcha : 'http://tneb.tnebnet.org/newlt/captcha_code_file.php',
    Data : 'http://tneb.tnebnet.org/newlt/menu3.html',
    NewData : 'http://wss.tangedco.gov.in/wss/AccSummaryNew.htm?scnumber=',
    Shutdowns : 'http://tneb.tnebnet.org/cpro/today.html',
    ReadPageKeyWords : ['ACCOUNT SUMMARY','CONSUMER NAME','CONSUMER NUMBER','VIEW ANOTHER'],
    NewReadPageKeyWords : ['Service Details','Due Amount To Be Paid'],
    AccountInvalidKeywords : ['NOT A VALID CONSUMER'],
    NewAccountInvalidKeywords : ['Invalid Input'],
    NoConnectivityKeywords : ['No Connectivity'],
    FormKeywords : ['Choose Region','Service Number','Captcha'],
    PlayStoreLink : 'http://play.google.com/store/apps/details?id=com.bas.TNLiteNew',
    TwitterLink   : 'https://twitter.com/tnlite',
    MarketLink : 'market://details?id=com.bas.TNLiteNew',
    Regions : [
        { id:1,name : "01-Chennai-North"},
        { id:2,name : "02-Villupuram" },
        { id:3,name : "03-Coimbatore"},
        { id:4,name : "04-Erode"},
        { id:5,name : "05-Madurai"},
        { id:6,name : "06-Trichy"},
        { id:7,name : "07-Tirunelveli"},
        { id:8,name : "08-Vellore"},
        { id:9,name : "09-Chennai-South"}
    ],
    checkKeywords : function(content,words){
        var flag = 1;
        for (var i=0;i<words.length;i++){
            var word = words[i];
            matches = content.match(word); 
            if (!matches) {
                flag = 0;
                break;
            }
        }
        return flag;
    },
    getPostParams : function(rc,cn,cap) {
        var sp = cn.match(/(...)(...)(.*)/);
        var sec = sp[1];
        var dist = sp[2];
        var serno = sp[3];

        var ip,ip1;
        //my($ip,$ip1) = ('223','223.227.62.91');

        var post_params = {
            "code" : rc,
            "6_letters_code" : cap,
            "dist" : dist,
            "sec"  : sec,
            "serno" : serno,
            "ip"   : ip,
            "ip1"  : ip1,
            "proceed" : "Proceed"
        };

        return post_params;

    },
    parseResponse : function(content) {
        //var matches = content.match(/No Connectivity/);
        if(!content) {
            return {
                state : 'Error'
            };
        }

        if (objMain.checkKeywords(content,objMain.NoConnectivityKeywords)) {
            return {
                state : 'Error'
            };
        }

        if (objMain.checkKeywords(content,objMain.AccountInvalidKeywords)) {
            return {
                state : 'InValid'
            };
        }

        if (objMain.checkKeywords(content,objMain.ReadPageKeyWords)) {
            return {
                state : 'Valid',
                data  : objMain.parseRead(content)
            }
        }

        if (objMain.checkKeywords(content,objMain.NewAccountInvalidKeywords)) {
            return {
                state : 'InValid'
            };
        }

        if (objMain.checkKeywords(content,objMain.NewReadPageKeyWords)) {
            return {
                state : 'Valid',
                data  : objMain.parseNewRead(content)
            }
        }

        if (objMain.checkKeywords(content,objMain.FormKeywords)) {
            return {
                state : 'InValid'
            };
        }

        //New response 
        return {
            state : 'Error'
        };

    },
    parseNewRead : function(content) {
        var result = { 
            ConsumerName : "",
            ConsumerNo : "",
            TotalAmountDue : "",
            Address : "",
            MeterNumber : "",
            Details : []
        };

        var map = {
            4 : "ConsumerName",
            6 : "ConsumerNo",
            26 : "MeterNumber",
            28 : "Address",
            10 : "OldServiceNumbers"
        };

        var x = $(content).find("td");

        var node =  $(x).find("tr td");

        $.each( node , function(i,el) {
            var item = $(el).text().replace(/\s/g,"");
            item = item.replace(/,/g,"");

            if(!item) {
                return;
            }

            if(map[i]) {
                if(item.length > 25 ) {
                    var p1 = item.substring(0,25);
                    var p2 = item.substring(25,item.length);
                    item = p1 + "\n" + p2;
                }  

                result[map[i]] = item;
            }

        });

        if ( node ) {
            var closing_balance = $(node[node.length - 1]).text();
            result.TotalAmountDue = closing_balance;
            if ( closing_balance > 0 ) {
                result.Details.push(['Pending balance' , closing_balance ,'UnKnown']);
            }
        }

        return result;
    },
    parseRead : function(content) {
        var result = { 
            ConsumerName : "",
            ConsumerNo : "",
            TotalAmountDue : "",
            Address : "",
            MeterNumber : "",
            Details : []
        };

    var x = $(content).find("td");

    var meter_index;
    var address_index;

    $.each( $(x).find("tr td") , function(i,el) {
        var item = $(el).text().replace(/\s/g,"");
        item = item.replace(/,/g,"");
        
        if(!item) {
            return;
        }

        var name_match = item.match(/CONSUMERNAME\:(.*)/);
        if(name_match) {
            result.ConsumerName = name_match[1];
        }

        var num_match = item.match(/CONSUMERNUMBER\:(.*)/);
        if(num_match) {
            result.ConsumerNo = num_match[1];
        }

        var old_service_match = item.match(/OLDSERVICENUMBER\:(.*)/);
        if(old_service_match){
            result.OldServiceNumbers = old_service_match[1]; 
        }

        var meter_match = item.match(/METERNUMBER/);
        if(meter_match) {
            meter_index   = i+1;
            address_index = i+4;
            return false;
        }

    });

    var all =  $(x).find("tr td");

    var d_meter_num = $(all[meter_index]).text();
    result.MeterNumber = d_meter_num.replace(/\s/g,"");

    var d_address = $(all[address_index]).text();
    //    d_address = d_address.replace(/\n/g,"");
    result.Address = d_address.replace(/^\s\s/,"");

    var tables = $(x).find("table");
        var d_table = tables[5];

        var dues =  $(d_table).find("tr td");
        var row_count = parseInt(dues.length/6);

        var start = 6;
        for (var i=1; i<=row_count ;i++) {
            if (i == row_count) { 
                //Total row 
                start++; //skip bill month
                start++; //skip bill year
                start++; //skip bill acc.desc
                var total_amount = $(dues[start++]).text();
                result.TotalAmountDue = total_amount;

            }else {
                start++; //skip bill month
                start++; //skip bill year
                start++; //skip bill acc.desc
                var amt =  $(dues[start++]).text();
                var due_date = $(dues[start++]).text();
                var desc = $(dues[start++]).text();
                result.Details.push([desc , amt ,due_date]);
            }
        }
        
        //LastRead 
        var last_read_index; 
        $.each( $(content).find("tr td") , function(i,el) {
            var e_text = 'Monthly Consumption Charge Collection Details';
            if(e_text == $(el).text()){
                last_read_index = i + 9;
                return false;
            }
        });
        if(last_read_index) {
            var lr = $(content).find("tr td");
            var lri = lr[last_read_index];
            result.LastRead = $(lri).text();
        }
        return result;
    },
    parseShutdown : function(content) {
        var x = $(content).find("table");
        var t = $(x[1]).html();
        if ( !t ) {
            return {};
        }
        if (objMain.checkKeywords(t,['DATE','AREA'])){
            return {
                data : t
            };
        }else {
            return {};
        }
    },
    isIFrame : function(content) {
        if (objMain.checkKeywords(content,['<iframe'])) {
            return true;
        }
        return false;
    },
    usage_estimate : function(units){
        var slabed_units =0;
        var amount = 0;
        if (units > 0 && units <= 100) {
            amount = 0;
        }
        else if (units <= 200) {
            slabed_units = units - 100;
            amount = 20 + slabed_units*1.5;
        }
        else if (units <= 500) {
            slabed_units = units - 100;
            amount = 30 + 100*2 + (slabed_units - 100)*3;
        }
        else if (units > 500) {
            slabed_units = units - 100;
            amount = 50 + 100*3.5 + 300*4.6 + (slabed_units - 400)*6.6
        }
        return amount.toFixed(2);
    }
};
