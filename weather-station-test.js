angular.
  module('currentWeatherTest', []).
  value('cities', [ // for the exercise, the cities are given, but in a real world, we would need either a method to list the cities or an input for the user
    {'id': 2643743, 'name': 'London', 'countryCode': 'uk'},
    {'id': 2643339, 'name': 'Luton', 'countryCode': 'uk'},
    {'id': 2643123, 'name': 'Manchester', 'countryCode': 'uk'},
    {'id': 2655603, 'name': 'Birmingham', 'countryCode': 'uk'}
  ]).
  controller('CurrentWeatherController', ['$scope', 'cities', 'CurrentWeather', function ($scope, cities, CurrentWeather) {
    /*
     * The controller is very light and only get data from the factory to insert it in the view
     */
    $scope.cities = cities;
    $scope.getCurrentWeather = function(cityIndex)  {
      $scope.weather = null;
      $scope.error = null;
      $scope.waitLoading = true;
      $scope.selectedCity = cityIndex;
      var weather = new CurrentWeather();
      weather.getWeather(cities[cityIndex]).
      then(function() {
        $scope.weather = weather;
      }, function(error) {
        $scope.error = error;
      }).
      finally(function() {
        $scope.waitLoading = false;
      });
    }
    $scope.sortByTemperature = function()  {
      $scope.weather = null;
      $scope.errorTemp = null;
      $scope.waitLoadingTemp = true;
      var cityArray = [];
      for(var i=0; i<cities.length; i++) {
        cityArray.push(cities[i].id);
      }
      CurrentWeather.getTemperatures(cityArray).
      then(function(result) {
        for(var i=0; i<cities.length; i++) {
          //we assume the order is respected
          $scope.cities[i].temperature = result[i];
        }
      }, function(error) {
        $scope.errorTemp = error;
      }).
      finally(function() {
        $scope.waitLoadingTemp = false;
      });
    }

  }]).
  factory('CurrentWeather', ['$http', '$q', function($http, $q) {
    /*
     * This factory returns an instanciable function CurrentWeather with object methods and class method
     */
    var apiUrl = 'http://api.openweathermap.org/data/2.5/';
    function CurrentWeather(data) {
      if(data) {
        this.setData(data);
      }
    };
    CurrentWeather.prototype = {
      setData: function(data) {
        angular.extend(this, data);
        this.main.temperature = parseInt(this.main.temp / 10);
        this.main.temperature_min = parseInt(this.main.temp_min / 10);
        this.main.temperature_max = parseInt(this.main.temp_max / 10);
        this.weather[0].icon_url = 'http://openweathermap.org/img/w/' + this.weather[0].icon + '.png';
      },
      getWeather: function(city) {
        /*
         * This method could be improved in a further version to cache objects already got from a previous http call if a given delay is not over.
         * A class attrbiute could store the cached data.
         */
        var deferred = $q.defer();
        var self = this;
        $http.get(apiUrl + 'weather?id=' + city.id).
          success(function(data) {
            // A good API should not return an HTTP request with a return code = 200 and, in the response, an attribute to 404
            if(data.cod == 200) {
              self.setData(data);
              deferred.resolve(data);
            } else  if(data.cod == 404) {
              deferred.reject(data.message);
            }
          }).
          error(function(error) {
            deferred.reject(error);
          });
        return deferred.promise;
      }
    };
    /*
     * Get the temperatures of list of city ids. It's a static method as it is not related to 1 current weather. Here we should also cache the data.
     */
    CurrentWeather.getTemperatures = function(cities) {
        var deferred = $q.defer();
        var self = this;
        $http.get(apiUrl + 'group?id=' + cities.join(',')).
          success(function(data) {
            // Here the API is even worse, because it is not constistant as there is no cod attribute
            if(!data.list) {
              deferred.reject(data.message);
            } else {
              var temperatures = [];
              for(var i=0; i<data.list.length; i++) {
                temperatures[i] = parseInt(data.list[i].main.temp / 10);
              }
              deferred.resolve(temperatures);
            }
          }).
          error(function(error) {
            deferred.reject(error);
          });
        return deferred.promise;
    };
    return CurrentWeather;
  }]);