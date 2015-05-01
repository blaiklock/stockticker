http://sravi-kiran.blogspot.com/2013/05/ImplementingSignalRStockTickerUsingAngularJSPart2.html

var app = angular.module('tickerTape', ['ngRoute', 'LocalStorageModule']);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/ticker', {
        controller: 'MainController',
        templateUrl: 'app/partials/ticker_view.html'
    }).when('/settings', {
        controller: 'MainController',
        templateUrl: 'app/partials/settings_view.html'
    }).otherwise({
        redirectTo: '/ticker'
    });
}]);

app.config(['localStorageServiceProvider', function(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('ls');
}]);

app.controller('MainController', ['$scope', '$http', '$timeout', 'localStorageService', function($scope, $http, $timeout, localStorageService) {
    var symbolsInStore = localStorageService.get('symbols');
    
    $scope.parseFloat = parseFloat;
    
    $scope.shouldScroll = false;
    
    $scope.symbols = symbolsInStore || ['AAPL', 'MSFT', 'XOM', 'JNJ'];
    
    $scope.$watch('symbols', function() {
        localStorageService.set('symbols', $scope.symbols);
    }, true);
    
    function encodeSymbols() {
        var symbols = [];
        for (var i=0; i<$scope.symbols.length; i++) {
            symbols[i] = '"' + $scope.symbols[i] + '"';
        }
        return encodeURIComponent(symbols.join(','));
    };

    var poller = function () {
        console.log('Polling...');
        $http({
            method: 'JSONP',
            url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20(' + encodeSymbols() + ')&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK'
        }).success(function (data, status) {
            $scope.quotes = data.query.results.quote;
            console.log('Success status code: ' + status);
        }).error(function (data, status) {
            // log error
            console.log('Error status code: ' + status);
        });
        // 5 minutes 300000
        $timeout(poller, 60000);
        $scope.lastPollTime = new Date();
        $scope.shouldScroll = true;
    };
    poller();
}]);

app.directive('scrollTicker', function () {
    return function (scope, elem, attrs) {
        var $scrollTickerUI = $(elem);
        var flag = elem.attr('scroll-ticker');
        //scroll();

        function scroll() {
            if (scope.$eval(flag)) {
                // witdh on load is 0
                var w = $scrollTickerUI.width();
                console.log('width is ' + w);
                $scrollTickerUI.css({
                    marginLeft: w
                });
                $scrollTickerUI.animate({
                    marginLeft: -w
                }, 15000, 'linear', scroll);
            } else
                $scrollTickerUI.stop();
        }

        scope.$watch(flag, function (value) {
            scroll();
        });
    }
});

app.filter('change', function() {
    return function(changeAmount) {
        if (changeAmount > 0) {
            return "\u25B2 " + parseFloat(changeAmount).toFixed(2);
        }
        else if (changeAmount < 0) {
            return "\u25BC " + parseFloat(changeAmount).toFixed(2);
        }
        else {
            return parseFloat(changeAmount).toFixed(2);
        }
    } 
});