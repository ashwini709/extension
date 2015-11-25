var newTab = (function ($, document, chromeLocalStorage, navigator, console) {

    var initialize = function() {
        $( "#search-bar" ).autocomplete({
            source: function(request, response) {
                var q= "http://suggestqueries.google.com/complete/search";
                $.ajax({
                    url: q,
                    data: {
                        "client": "firefox",
                        "q": request.term
                    }
                }).done(function (data){
                    data=$.parseJSON(data)
                    var key= data[0];
                    response(data[1].slice(0,5));
                });
            },
            select: function( event, ui ) {
                if (event.which === 13) {
                    window.open("https://www.google.com/#q="+ui.item.value,"_self");
                }
            }
        });
    }
    var setBackground = function() {
        if (chromeLocalStorage.getItem("imageContainer")) {
            var imageFolder = chromeLocalStorage.getItem("imageContainer");
        }else {
            var imageFolder = Math.floor(Math.random()*5)+1;
        }
        var image = Math.floor(Math.random()*6)+1;
        var imgUrl = "/images/"+imageFolder+"/"+image+".jpg";
        document.querySelector(".bg").style.backgroundImage="url("+imgUrl+")";
        $(".bg").css("opacity",1);
        $(".bg").css("background-position", "center");
        $(".bg").css("background-size", "cover");
    };

    var displayQuote = function() {
        $.ajax({
            url: 'http://www.iheartquotes.com/api/v1/random?max_characters=60&format=json'
        }).success(function(quoteJson) {
            var quote=quoteJson.quote;
            chromeLocalStorage.setItem("quote", quote);
            chromeLocalStorage.setItem("quoteTimestamp", Date.now());
            $(".quote-container").text(quote);
        });
    };

    var handleClickEvents = function() {
        $("#search-bar").keypress(function(e) {
            if(e.which == 13) {
                window.open("https://www.google.com/#q="+$("#search-bar").val(),"_self");
            }
        });
    };

    var handleSettings = function() {
        $(".settings").on("click", function(e){
            $("#optionsMenu").toggleClass("hidden");
            e.stopPropagation();
        });

        $("#optionsMenu li").on("click", function(e) {
            var imageContainer = e.currentTarget.id;
            if (0 < parseInt(imageContainer) < 7) {
                chromeLocalStorage.setItem("imageContainer", imageContainer);
                return setBackground();
            };
            chromeLocalStorage.setItem("imageContainer", 0);
        });
    };

    var startTime = function() {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        m = checkTime(m);
        document.getElementById('time').innerHTML = h + ":" + m;
        var t = setTimeout(startTime, 500);
    };

    var checkTime = function(i) {
        if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
        return i;
    };

    var displayWeather = function (cached) {
        var timestamp= chromeLocalStorage.getItem("weatherTimestamp");

        //weather check every 30 mins
        if(cached && timestamp && Date.now()-timestamp<1800000 && chromeLocalStorage.getItem("weatherData")) {
            _setWeather(JSON.parse(chromeLocalStorage.getItem("weatherData")));
        }
        else {
            navigator.geolocation.getCurrentPosition(function(location) {
                var returnObj, weatherCode, sunset, sunrise;
                $.ajax({
                    url: "http://api.openweathermap.org/data/2.5/weather?APPID=5604de39af7595c4b8051c066c6b97d7",
                    data: {
                        lat: location.coords.latitude,
                        lon: location.coords.longitude
                    }
                }).done(function (data){
                    debugger
                    weatherCode = data.weather[0].id;
                    sunset = data.sys.sunset;
                    sunrise = data.sys.sunrise;
                    var iconClass = _getWeatherIcon(weatherCode, sunset, sunrise);
                    var cur_temp = parseInt(data.main.temp);

                    returnObj = {
                        "iconClass" : iconClass,
                        "cityName" : data.name,
                        "weatherDesc" : data.weather[0].main,
                        "cur_temp" : cur_temp
                    };
                    console.log(returnObj);
                    chromeLocalStorage.setItem("weatherData",JSON.stringify(returnObj));
                    chromeLocalStorage.setItem("weatherTimestamp",Date.now());
                    _setWeather(returnObj);
                }).fail(function(){
                    console.log("Failed to fetch weather");
                });
            });
        }
    };


    var _setWeather = function (weatherObj) {
        var user_preffered_unit = _getWeatherUnit();
        var cur_temp = weatherObj.cur_temp;

        if(user_preffered_unit=="Fahrenheit") {
            cur_temp=(weatherObj.cur_temp-273)* 1.8 + 32.0;
        }
        else if(user_preffered_unit=="Celsius") {
            cur_temp-=273;
        }
        cur_temp=parseInt(cur_temp);

        // $("#weather").removeClass();
        // $("#weather").addClass("inline-block").addClass(weatherObj.iconClass);
        $("#location").html(weatherObj.cityName);
        // $("#cond").html(weatherObj.weatherDesc);
        $("#weather").html(cur_temp);
        $("#thermo").html(_getWeatherUnit());
    }

    var _getWeatherUnit = function() {
        if(!chromeLocalStorage.getItem("unit")) {
            chromeLocalStorage.setItem("unit","Fahrenheit");
        }
        return chromeLocalStorage.getItem("unit");
    };


    var _setWeatherUnit = function(unitToBeSet) {
        chromeLocalStorage.setItem("unit",unitToBeSet);
    };

    var _getWeatherIcon= function (weatherCode, sunset, sunrise) {
        var rain = [200,201,202,300,301,302,310,311,312,313,314,321,500,501,502,503,504,511,520,521,522,531];
        var thunderstorm = [210,211,212,221,230,231,232,956,957,958,959,960,961,962];
        var snow= [600,601,602,611,612,615,616,620,621,622,906];
        var sunny = [800,801];
        var clouds= [802,803,804,900,901,902,905];
        var rainbow = [951,952,953,954,955];
        var haze = [701,711,721,731,741,751,761,762,771,781];
        if(rain.indexOf(weatherCode)>-1) {
            return "rainy";
        }
        if(thunderstorm.indexOf(weatherCode)>-1) {
            return "stormy";
        }
        if(snow.indexOf(weatherCode)>-1) {
            return "snowy";
        }
        if(sunny.indexOf(weatherCode)>-1) {
            if(Date.now()/1000<sunset && Date.now()/1000>sunrise) {
                return "sunny";
            }
            return "starry";
        }
        if(clouds.indexOf(weatherCode)>-1) {
            return "cloudy";
        }
        if(rainbow.indexOf(weatherCode)>-1) {
            return "rainbow";
        }
        else {
            return "haze";
        }
    };

    return {
        initialize:initialize,
        setBackground:setBackground,
        startTime:startTime,
        displayQuote:displayQuote,
        displayWeather:displayWeather,
        handleClickEvents:handleClickEvents,
        handleSettings:handleSettings
    }

})(jQuery, document, localStorage, navigator, console);

$(document).ready(function(){
    newTab.initialize();
    newTab.setBackground();
    newTab.startTime();
    newTab.handleClickEvents();
    newTab.handleSettings();
    newTab.displayWeather();
    // newTab.displayQuote();
});
