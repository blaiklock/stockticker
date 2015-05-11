//http://sravi-kiran.blogspot.com/2013/05/ImplementingSignalRStockTickerUsingAngularJSPart2.html

var app = angular.module('tickerTape', ['ngRoute', 'LocalStorageModule']);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/ticker', {
        controller: 'MainController',
        templateUrl: 'app/partials/ticker_view.html'
    }).when('/settings', {
        controller: 'MainController',
        templateUrl: 'app/partials/settings_view.html'
    }).when('/about', {
        controller: 'MainController',
        templateUrl: 'app/partials/about_view.html' 
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
    
    $scope.symbols = symbolsInStore || ['AAPL', 'MSFT', 'XOM', 'JNJ'];
    
    var isMoving = false;
    
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
            if (!isMoving) {
                $scope.$broadcast('dataloaded');
                isMoving = true;
            }
            
        }).error(function (data, status) {
            // log error
            console.log('Error status code: ' + status);
        });
        // 5 minutes 300000
        $timeout(poller, 60000);
        $scope.lastPollTime = new Date();
        
    };
    poller();
}]);

app.directive('ticker', ['$timeout', function($timeout) {
    return {
        link: function($scope, element, attrs) {
            $scope.$on('dataloaded', function() {
                $timeout(function() {
                    $("#webticker").webTicker({speed: 75});
                }, 0, false);
            })
        }
    };
}]);



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